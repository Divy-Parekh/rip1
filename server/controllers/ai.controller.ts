import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, GEMINI_PROXY } from "../config/env.js";
import { extractPdfData } from "../services/pdf.service.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import nodeFetch from "node-fetch";

// Setup Proxy if available
let requestOptions: any = {};
if (GEMINI_PROXY) {
  console.log(`[Gemini AI] Using Proxy from environment: ${GEMINI_PROXY.replace(/:[^:@]+@/, ":****@")}`);
  const agent = new HttpsProxyAgent(GEMINI_PROXY);
  const proxiedFetch = (url: any, options: any) => nodeFetch(url, { ...options, agent });
  requestOptions = { fetch: proxiedFetch };
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: { responseMimeType: "application/json" }
}, requestOptions);

// Helper to interact with Gemini uniformly
const generateWithGemini = async (prompt: string) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Gemini API Error details:", err);
    throw new Error(`Gemini AI Error: ${err.message}`);
  }
};

// Helper for internal use (e.g. drive controller)
export const parseResumeTextHelper = async (rawText: string) => {
  const prompt = `
Extract structured information from this resume text. 
Return a JSON object with this structure:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string",
  "socialLinks": [{ "platform": "string", "url": "string" }],
  "skills": ["string"],
  "experience": [{ "company": "string", "role": "string", "duration": "string", "description": "string" }],
  "projects": [{ "name": "string", "description": "string", "technologies": ["string"], "url": "string" }],
  "education": [{ "institution": "string", "degree": "string", "year": "string" }],
  "totalExperienceYears": number
}

Resume text:
${rawText}
`;
  return await generateWithGemini(prompt);
};

export const parseResume = async (req: AuthRequest, res: Response) => {
  try {
    let { rawText } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ success: false, message: "rawText is required" });
    }

    if (rawText.startsWith("[PDF base64 input]") || rawText.startsWith("[PDF content encoded in base64")) {
      const lines = rawText.split("\n");
      const base64Data = lines.slice(1).join("").trim();
      
      try {
        const buffer = Buffer.from(base64Data, 'base64');
        const { text, links } = await extractPdfData(buffer);
        rawText = text;
        if (links && links.length > 0) {
          rawText += "\n\nEmbedded Links Found in PDF:\n" + links.join("\n");
        }
      } catch (pdfErr) {
        console.error("PDF Parsing failed in AI controller:", pdfErr);
      }
    }

    const parsed = await parseResumeTextHelper(rawText);
    res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Error parsing resume with Gemini:", error);
    res.status(500).json({ success: false, message: error.message || "AI parsing failed" });
  }
};

export const matchRole = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateData, jobRole } = req.body;

    if (!candidateData || !jobRole) {
      return res.status(400).json({ success: false, message: "candidateData and jobRole are required" });
    }

    const prompt = `
Analyze the candidate's match for this job role.
Job: ${jobRole.title} (Skills: ${jobRole.requiredSkills?.join(", ")}, Experience: ${jobRole.minExperience}y)
Candidate: ${candidateData.fullName} (Skills: ${candidateData.skills?.join(", ")}, Experience: ${candidateData.totalExperienceYears}y)

Return JSON:
{
  "matchScore": number (0-100),
  "missingSkills": ["string"],
  "matchedSkills": ["string"],
  "summary": "string assessment"
}
`;

    const parsed = await generateWithGemini(prompt);
    res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Error matching role with Gemini:", error);
    res.status(500).json({ success: false, message: error.message || "AI role match failed" });
  }
};

export const generateQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateData, jobRole } = req.body;

    if (!candidateData || !jobRole) {
      return res.status(400).json({ success: false, message: "candidateData and jobRole are required" });
    }

    const prompt = `
Generate 8 tailored interview questions for:
Role: ${jobRole.title}
Candidate: ${candidateData.fullName}
Skills: ${candidateData.skills?.join(", ")}

Return a JSON array of objects:
[{
  "question": "string",
  "type": "technical" | "scenario" | "project" | "behavioral",
  "context": "string",
  "answerGuide": "string"
}]
`;

    const parsed = await generateWithGemini(prompt);
    res.status(200).json(Array.isArray(parsed) ? parsed : []);
  } catch (error: any) {
    console.error("Error generating questions with Gemini:", error);
    res.status(500).json({ success: false, message: error.message || "AI generation failed" });
  }
};
