import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Initialize Gemini API Client
  const aiApiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: aiApiKey || "placeholder-key-to-prevent-crash",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Helper to handle AI requests gracefully when key is missing or invalid
  const checkApiKey = () => {
    if (!aiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.");
    }
  };

  // 2. API Endpoints for AI Capabilities
  
  // AI student performance analysis
  app.post("/api/ai/analyze-performance", async (req, res) => {
    try {
      checkApiKey();
      const { studentName, subjectGrades, attendanceRate, recentRemarks } = req.body;

      if (!studentName || !subjectGrades) {
        return res.status(400).json({ error: "Missing studentName or subjectGrades in request." });
      }

      const prompt = `
        You are an expert school principal and educational psychologist analyzing an academic performance file for student: ${studentName}.
        
        Academic Profile:
        - Subject Grades & Scores: ${JSON.stringify(subjectGrades)}
        - Daily Attendance Rate: ${attendanceRate}%
        - Parent / Teacher remarks on file: "${recentRemarks || "None provided"}"
        
        Generate a concise, highly insightful diagnostic assessment (about 2-3 short, actionable paragraphs) with the following structure:
        1. Current Status: Synthesize their core academic status and highlights.
        2. Diagnosis & Deep-dive: Highlight weak areas, risks, or potential drop-offs (e.g. Chemistry, Math) and attendance correlations.
        3. Recommendation: Detail specific, teacher-friendly, and actionable recommendations (e.g., specialized reading exercises, chemistry tutoring, homework trackers).
        
        Write in a constructive, warm, supportive, and professional tone.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("AI Performance Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI performance review." });
    }
  });

  // AI report card comments generator for teachers
  app.post("/api/ai/report-comments", async (req, res) => {
    try {
      checkApiKey();
      const { studentName, subjectName, score, term, commentsTone } = req.body;

      if (!studentName || !subjectName || score === undefined) {
        return res.status(400).json({ error: "Missing studentName, subjectName, or score." });
      }

      const prompt = `
        You are a dedicated classroom teacher composing the official term report card comment for student: ${studentName}.
        
        Context:
        - Subject: ${subjectName}
        - Total Score: ${score}/100
        - Diagnostic Term: ${term || "Current Term"}
        - Desired Character/Tone: ${commentsTone || "encouraging and constructive"}
        
        Draft a brief, professional, and teacher-friendly report card remark (2-3 sentences).
        It must feel highly personalized, professional, reference their score category naturally (e.g., high-performing vs needing improvements), and end with a specific forward-looking milestone or next step.
        Do not output any introductory or concluding comments, only output the finalized remark itself.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ comment: response.text });
    } catch (error: any) {
      console.error("AI Comment Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate report card mark." });
    }
  });

  // AI school-wide performance insights
  app.post("/api/ai/school-insights", async (req, res) => {
    try {
      checkApiKey();
      const { stats } = req.body;

      const prompt = `
        You are the General superintendent or chief academic advisor of "Best School Manager".
        Analyze the school analytics summary below to generate high-level management recommendations and executive insights:
        
        School Aggregations:
        ${JSON.stringify(stats)}
        
        Provide:
        1. Academic Insights: Highlight the top 1-2 performing areas and the 1-2 weakest subjects.
        2. Attendance Risk: Outline risk levels based on attendance indexes.
        3. Administrative Takeaway: Provide 2 constructive school improvement plans.
        
        Keep it structured, clean, and professional for school boards.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch (error: any) {
      console.error("AI School Insights Error:", error);
      res.status(500).json({ error: error.message || "Failed to compile school insights." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // 3. Vite middleware for React asset bundling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
