import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, InterviewQuestion, JobRole, Candidate } from "../types";

const API_KEY = process.env.API_KEY || "";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: API_KEY });

const RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fullName: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    location: { type: Type.STRING },
    summary: { type: Type.STRING },
    socialLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: {
            type: Type.STRING,
            description: "e.g., LinkedIn, GitHub, Portfolio",
          },
          url: { type: Type.STRING },
        },
      },
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
          url: { type: Type.STRING },
        },
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: { type: Type.STRING },
          degree: { type: Type.STRING },
          year: { type: Type.STRING },
        },
      },
    },
    totalExperienceYears: {
      type: Type.NUMBER,
      description:
        "Calculated total years of professional experience based on work history.",
    },
  },
  required: ["fullName", "email", "skills", "experience"],
};

// Input can be a raw string (from txt/docx) OR a file object (from pdf)
export const parseResumeText = async (
  input: string | { base64: string; mimeType: string },
): Promise<ResumeData> => {
  try {
    let contents;

    if (typeof input === "string") {
      // Text mode (TXT, MD, extracted DOCX)
      contents = `Extract structured data from the following resume text. Normalize skills to standard naming conventions (e.g., 'React.js' -> 'React'). extract all social links (linkedin, github, portfolio) and project urls.\n\nRESUME TEXT:\n${input}`;
    } else {
      // Multimodal mode (PDF)
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: input.mimeType,
              data: input.base64,
            },
          },
          {
            text: "Extract structured data from this resume document. Normalize skills to standard naming conventions. Extract all social links and project urls found.",
          },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESUME_SCHEMA,
        systemInstruction:
          "You are an expert HR Resume Parser. Extract accurate information. If a field is missing, use an empty string or empty array.",
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text) as ResumeData;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};

export const generateInterviewQuestions = async (
  candidate: Candidate,
  jobDescription?: string,
): Promise<InterviewQuestion[]> => {
  try {
    const context = `
      Candidate: ${candidate.fullName}
      Skills: ${candidate.currentData.skills.join(", ")}
      Experience: ${JSON.stringify(candidate.currentData.experience.slice(0, 2))}
      Projects: ${JSON.stringify(candidate.currentData.projects.slice(0, 2))}
      ${jobDescription ? `Job Description / Role Context: ${jobDescription}` : ""}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 tailored interview questions for this candidate${jobDescription ? " specifically for the provided Job Description" : ""}. 
      Include a mix of technical, scenario-based, and project-verification questions. 
      CRITICAL: For each question, provide a brief "answerGuide" describing key points a good candidate should mention.
      Return JSON.
      \n${context}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              type: {
                type: Type.STRING,
                enum: ["technical", "scenario", "project", "behavioral"],
              },
              context: {
                type: Type.STRING,
                description: "Why this question is relevant",
              },
              answerGuide: {
                type: Type.STRING,
                description: "Key points of a good answer",
              },
            },
          },
        },
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text) as InterviewQuestion[];
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};

export const analyzeCandidateMatch = async (
  candidate: Candidate,
  jobRole: JobRole,
): Promise<{
  score: number;
  analysis: string;
  matchedSkills: string[];
  missingSkills: string[];
}> => {
  try {
    const prompt = `
      Compare this candidate to the job role.
      Candidate Skills: ${candidate.currentData.skills.join(", ")}
      Candidate Exp: ${candidate.currentData.totalExperienceYears} years
      
      Job Role: ${jobRole.title}
      Required Skills: ${jobRole.requiredSkills.join(", ")}
      Min Exp: ${jobRole.minExperience} years
      
      Provide:
      1. A match score (0-100).
      2. A brief 1-sentence analysis.
      3. A list of matched skills (intersection).
      4. A list of missing skills (required but not present).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text);
  } catch (e) {
    console.error(e);
    return {
      score: 0,
      analysis: "Could not analyze.",
      matchedSkills: [],
      missingSkills: [],
    };
  }
};
