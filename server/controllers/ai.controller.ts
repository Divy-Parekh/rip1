import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env.js";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: { responseMimeType: "application/json" }
});

// Helper to interact with Gemini uniformly
const generateWithGemini = async (prompt: string) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(`Gemini AI Error: ${err.message}`);
  }
};

// @route  POST /api/ai/parse-resume
// Body:   { rawText: string }
export const parseResume = async (req: AuthRequest, res: Response) => {
  try {
    const { rawText } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ success: false, message: "rawText is required" });
    }

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

    const parsed = await generateWithGemini(prompt);
    res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Error parsing resume with Gemini:", error);
    res.status(500).json({ success: false, message: error.message || "AI parsing failed" });
  }
};

// @route  POST /api/ai/match-role
// Body:   { candidateData: any, jobRole: any }
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

// @route  POST /api/ai/generate-questions
// Body:   { candidateData: any, jobRole: any }
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
    // Ensure we return an array
    res.status(200).json(Array.isArray(parsed) ? parsed : []);
  } catch (error: any) {
    console.error("Error generating questions with Gemini:", error);
    res.status(500).json({ success: false, message: error.message || "AI generation failed" });
  }
};
