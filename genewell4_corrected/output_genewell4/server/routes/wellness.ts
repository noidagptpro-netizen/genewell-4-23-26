/**
 * wellness.ts
 * Fully wired wellness route handlers.
 *
 * PDF generation uses the GeneWell engine pipeline:
 *   computeWellnessProfile → buildSupplementStack → section variants
 *   → assembleWellnessReport → buildReportHTML → Puppeteer → PDF buffer
 *
 * Puppeteer is used for server-side HTML→PDF rendering because it faithfully
 * renders the styled A4 HTML template. Add to package.json if not present:
 *   "puppeteer": "^22.0.0"
 *
 * All other routes (quiz capture, download tracking, user dashboard) integrate
 * with the existing PostgreSQL schema via server/lib/db.ts.
 */

import { RequestHandler } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  getOrCreateUser,
  saveDownload,
  saveQuizSubmission,
  saveQuizResponse,
  createPurchase,
  getPurchases,
  query,
} from "../lib/db";
import { assembleWellnessReport } from "../lib/report-assembler";
import { buildReportHTML } from "../lib/report-html-template";
import { computeWellnessProfile } from "../lib/wellness-engine";
import { STORAGE, storePDFFile, getPDFBuffer, getPDFRecord, getPDFRecordsByUserId, getStorageStats } from "../lib/storage";

// ─── PDF generation ───────────────────────────────────────────────────────────

async function generatePDFBuffer(html: string): Promise<Buffer> {
  // Dynamic import so Puppeteer is optional (falls back gracefully in dev)
  let puppeteer: any;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    throw new Error(
      "Puppeteer is not installed. Run: npm install puppeteer\n" +
      "Alternatively, the HTML report can be served directly via /api/wellness/report-html/:analysisId"
    );
  }

  const browser = await puppeteer.default.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ─── Quiz submission ──────────────────────────────────────────────────────────

/**
 * POST /api/wellness/quiz
 * Accepts a flat quiz payload, computes the engine profile, stores quiz data,
 * and returns an analysisId that can be used to generate the PDF.
 *
 * Required body fields:
 *   name, email, age, gender, height_cm, weight_kg, diet_type,
 *   sleep_hrs, activity_level, meals_per_day, weight_goal
 */
export const handleWellnessQuizSubmission: RequestHandler = async (req, res) => {
  try {
    const body = req.body as Record<string, any>;

    // Minimal required field validation
    const required = ["name", "email", "age", "gender", "height_cm", "weight_kg"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(", ")}` });
    }

    // Compute profile immediately for validation and preview
    const profile = computeWellnessProfile(body);

    // Create or look up user record
    const user = await getOrCreateUser(
      body.email,
      body.name,
      body.phone,
      Number(body.age),
      body.gender,
      body.location
    );

    // Unique analysis ID for this quiz submission
    const analysisId = `analysis_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

    // Persist quiz data
    await saveQuizSubmission({
      userId:       user.id,
      userName:     body.name,
      userEmail:    body.email,
      userPhone:    body.phone,
      userAge:      Number(body.age),
      userGender:   body.gender,
      userLocation: body.location,
      quizData:     body,
      analysisId,
      ipAddress:    req.ip,
      userAgent:    req.headers["user-agent"],
    });

    // Cache personalization data for the purchase/PDF flow
    STORAGE.personalizationDataCache.set(analysisId, { quizData: body, profile });
    STORAGE.analysisIdToUserId.set(analysisId, String(user.id));

    res.json({
      success: true,
      analysisId,
      profilePreview: {
        name:         profile.name,
        bmi:          profile.bmi,
        bmiLabel:     profile.bmiLabel,
        tdee:         profile.tdee,
        goalCalories: profile.goalCalories,
        overallScore: profile.scores.overall,
        limitingFactor: profile.limitingFactor,
        scores:       profile.scores,
      },
    });
  } catch (error) {
    console.error("Wellness quiz submission error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Purchase ─────────────────────────────────────────────────────────────────

/**
 * POST /api/wellness/purchase
 * Creates a purchase record and triggers PDF generation.
 * The PDF is generated synchronously and stored in STORAGE.
 *
 * Body: { analysisId, planTier, addOns, price, userEmail }
 */
export const handleWellnessPurchase: RequestHandler = async (req, res) => {
  try {
    const { analysisId, planTier = "pro", addOns = [], price = 0, userEmail } = req.body;

    if (!analysisId) {
      return res.status(400).json({ success: false, message: "analysisId is required" });
    }

    // Retrieve cached quiz data
    const cached = STORAGE.personalizationDataCache.get(analysisId);
    if (!cached) {
      return res.status(404).json({ success: false, message: "Quiz data not found for this analysisId. Please re-submit the quiz." });
    }

    const userIdStr = STORAGE.analysisIdToUserId.get(analysisId);
    if (!userIdStr) {
      return res.status(404).json({ success: false, message: "User not found for this analysisId" });
    }
    const userId = Number(userIdStr);

    // Create purchase record
    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    await createPurchase(userId, analysisId, planTier, addOns, price);

    // Inject plan tier into quiz data for the engine
    const quizData = { ...cached.quizData, plan_tier: planTier, order_id: orderId };

    // Assemble the full report through the engine pipeline
    const report = assembleWellnessReport(quizData);
    const html   = buildReportHTML(report);

    // Attempt Puppeteer PDF generation
    let pdfRecordId: string | null = null;
    try {
      const pdfBuffer = await generatePDFBuffer(html);
      const filename = `wellness_blueprint_${report.profile.name.replace(/\s+/g, "_")}.pdf`;
      const pdfRecord = storePDFFile(pdfBuffer, filename, orderId, analysisId, planTier, addOns, report.profile.name);
      pdfRecordId = pdfRecord.pdfRecordId;
    } catch (pdfErr) {
      console.warn("PDF generation skipped (Puppeteer unavailable):", (pdfErr as Error).message);
    }

    // Record download event
    const emailField = userEmail ?? cached.quizData.email ?? "";
    if (emailField) {
      const userResult = await query("SELECT id FROM users WHERE email = $1", [emailField]);
      await saveDownload({
        userId:      userResult.rows[0]?.id,
        userEmail:   emailField,
        productName: `Wellness Blueprint — ${planTier}`,
        planTier,
        pdfRecordId: pdfRecordId ?? undefined,
        emailSent:   false,
      });
    }

    res.json({
      success: true,
      orderId,
      analysisId,
      pdfRecordId,
      downloadUrl: pdfRecordId ? `/api/wellness/download-pdf/${pdfRecordId}` : null,
      message: pdfRecordId
        ? "PDF generated successfully"
        : "Order created. PDF generation requires Puppeteer — install with: npm install puppeteer",
    });
  } catch (error) {
    console.error("Wellness purchase error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── PDF download ─────────────────────────────────────────────────────────────

/**
 * GET /api/wellness/download-pdf/:pdfRecordId
 * Streams the stored PDF buffer to the client.
 */
export const handlePDFDownload: RequestHandler = async (req, res) => {
  try {
    const { pdfRecordId } = req.params;
    const pdfRecord = getPDFRecord(pdfRecordId);

    if (!pdfRecord) {
      return res.status(404).json({ success: false, message: "PDF not found or expired" });
    }

    const buffer = getPDFBuffer(pdfRecordId);
    if (!buffer) {
      return res.status(404).json({ success: false, message: "PDF file not found on disk" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfRecord.filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/wellness/download-pdf-base64/:pdfRecordId
 * Returns the PDF as a base64-encoded string for client-side rendering.
 */
export const handlePDFDownloadBase64: RequestHandler = async (req, res) => {
  try {
    const { pdfRecordId } = req.params;
    const pdfRecord = getPDFRecord(pdfRecordId);

    if (!pdfRecord) {
      return res.status(404).json({ success: false, message: "PDF not found or expired" });
    }

    const buffer = getPDFBuffer(pdfRecordId);
    if (!buffer) {
      return res.status(404).json({ success: false, message: "PDF file not found on disk" });
    }

    res.json({
      success: true,
      pdfBase64: buffer.toString("base64"),
      filename: pdfRecord.filename,
      mimeType: "application/pdf",
    });
  } catch (error) {
    console.error("PDF base64 download error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/wellness/report-html/:analysisId
 * Serves the raw HTML report — useful for previewing without Puppeteer,
 * or for client-side print-to-PDF via window.print().
 */
export const handleReportHTML: RequestHandler = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const cached = STORAGE.personalizationDataCache.get(analysisId);

    if (!cached) {
      return res.status(404).json({ success: false, message: "Quiz data not found for this analysisId" });
    }

    const report = assembleWellnessReport(cached.quizData);
    const html   = buildReportHTML(report);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Report HTML error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/wellness/generate-pdf-on-demand/:analysisId
 * Generates a fresh PDF on demand from cached quiz data.
 * Useful for re-generation without going through the full purchase flow.
 */
export const handleGeneratePDFOnDemand: RequestHandler = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const cached = STORAGE.personalizationDataCache.get(analysisId);

    if (!cached) {
      return res.status(404).json({ success: false, message: "Quiz data not found. Please re-submit the quiz." });
    }

    const report = assembleWellnessReport(cached.quizData);
    const html   = buildReportHTML(report);

    const pdfBuffer = await generatePDFBuffer(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="genewell_${report.profile.name.replace(/\s+/g, "_")}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("On-demand PDF error:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ─── User data endpoints ──────────────────────────────────────────────────────

/**
 * GET /api/wellness/pdfs
 * Returns a list of PDFs belonging to the user identified by ?email=...
 */
export const handleListUserPDFs: RequestHandler = async (req, res) => {
  try {
    const email = req.query.email as string | undefined;
    if (!email) {
      return res.status(400).json({ success: false, message: "email query parameter is required" });
    }

    const userResult = await query("SELECT id FROM users WHERE email = $1", [email]);
    const userId = userResult.rows[0]?.id;
    if (!userId) {
      return res.json({ success: true, pdfs: [] });
    }

    const pdfs = getPDFRecordsByUserId(String(userId)).map((p) => ({
      pdfRecordId: p.pdfRecordId,
      orderId:     p.orderId,
      filename:    p.filename,
      planTier:    p.planTier,
      addOns:      p.addOns,
      generatedAt: p.generatedAt,
      expiresAt:   p.expiresAt,
      fileSize:    p.fileSize,
      downloadUrl: `/api/wellness/download-pdf/${p.pdfRecordId}`,
    }));

    res.json({ success: true, pdfs });
  } catch (error) {
    console.error("List user PDFs error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/wellness/dashboard/:userId
 * Returns quiz history, orders, and PDFs for a given user.
 */
export const handleUserDashboard: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = Number(userId);

    const [userResult, purchaseRows, downloadRows] = await Promise.all([
      query("SELECT id, email, name, age, gender, location, created_at FROM users WHERE id = $1", [uid]),
      getPurchases(uid),
      query("SELECT * FROM downloads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [uid]),
    ]);

    if (!userResult.rows[0]) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user:      userResult.rows[0],
      purchases: purchaseRows,
      downloads: downloadRows.rows,
      pdfs:      getPDFRecordsByUserId(userId).map((p) => ({
        pdfRecordId: p.pdfRecordId,
        orderId:     p.orderId,
        planTier:    p.planTier,
        generatedAt: p.generatedAt,
        expiresAt:   p.expiresAt,
        downloadUrl: `/api/wellness/download-pdf/${p.pdfRecordId}`,
      })),
    });
  } catch (error) {
    console.error("User dashboard error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/wellness/stats
 * Returns storage statistics (for admin use).
 */
export const handleStorageStats: RequestHandler = async (req, res) => {
  try {
    res.json({ success: true, stats: getStorageStats() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/wellness/sample-pdf
 * Generates a sample PDF with demo data — useful for testing without real quiz submissions.
 */
export const handleSamplePDF: RequestHandler = async (req, res) => {
  try {
    const sampleQuiz = {
      name: "Demo User",
      email: "demo@genewell.in",
      age: 28,
      gender: "female",
      height_cm: 162,
      weight_kg: 60,
      diet_type: "vegetarian",
      location: "bangalore",
      sleep_hrs: "6_7",
      sleep_quality: "fair",
      wake_time_slot: "6_7am",
      bed_time_slot: "11pm_12am",
      activity_level: "lightly_active",
      work_schedule: "office",
      stress_rating: 3,
      energy_pattern: "afternoon_crash",
      meals_per_day: 3,
      first_meal_time: "8_10am",
      eating_out_freq: "sometimes",
      hydration_glasses: "6_8",
      medical_conditions: ["none"],
      medications: ["none"],
      food_intolerances: ["none"],
      supplements_current: ["none"],
      digestive_issues: ["bloating"],
      skin_concerns: ["dryness"],
      mood_patterns: ["brain_fog"],
      exercise_pref: ["yoga"],
      family_history: ["none"],
      cravings: ["sweet_foods"],
      menstrual_status: "regular",
      weight_goal: "maintain",
      budget_tier: "500_1500",
      dna_upload: "none",
      plan_tier: "pro",
      order_id: "SAMPLE-001",
    };

    const report = assembleWellnessReport(sampleQuiz);
    const html   = buildReportHTML(report);

    try {
      const pdfBuffer = await generatePDFBuffer(html);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="genewell_sample_report.pdf"');
      res.send(pdfBuffer);
    } catch {
      // Puppeteer not available — serve HTML instead
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    }
  } catch (error) {
    console.error("Sample PDF error:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ─── Download event (analytics) ───────────────────────────────────────────────

export const handleDownloadEvent: RequestHandler = async (req, res) => {
  try {
    const { userEmail, productName, planTier, pdfRecordId } = req.body;

    const userResult = await query("SELECT id FROM users WHERE email = $1", [userEmail]);
    const userId = userResult.rows[0]?.id;

    await saveDownload({
      userId,
      userEmail,
      productName,
      planTier,
      pdfRecordId,
      downloadUrl: null,
      emailSent:   false,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Download event capture error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Passthrough stubs kept for route compatibility ───────────────────────────

/** POST /api/wellness/payment — delegates to /api/payments/* in production */
export const handleWellnessPayment: RequestHandler = async (req, res) => {
  res.status(308).json({
    success: false,
    message: "Use /api/payments/create-payment-request instead",
    redirectTo: "/api/payments/create-payment-request",
  });
};

/** GET /api/wellness/download/:analysisId — generates PDF on-demand from cached data */
export const handleWellnessDownload: RequestHandler = handleGeneratePDFOnDemand;

/** GET /api/products/download/:productId */
export const handleProductDownload: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await query("SELECT * FROM managed_products WHERE id = $1 AND visible = true", [parseInt(productId)]);
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
