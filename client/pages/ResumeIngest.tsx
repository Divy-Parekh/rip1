import React, { useState } from "react";
import { parseResumeText } from "../services/aiService";
import { addOrUpdateCandidate, uploadFile } from "../services/storageService";
import { v4 as uuidv4 } from "uuid";
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileType,
  X,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import mammoth from "mammoth";

type FileStatus = "pending" | "processing" | "success" | "error";

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  progress?: string;
  error?: string;
  candidateId?: string;
}

const ResumeIngest: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referrer, setReferrer] = useState("");

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const win = window as unknown as Record<
        string,
        {
          getDocument: (ab: ArrayBuffer) => {
            promise: Promise<{
              numPages: number;
              getPage: (n: number) => Promise<{
                getTextContent: () => Promise<{ items: { str: string }[] }>;
                getAnnotations: () => Promise<{ subtype: string; url?: string }[]>;
              }>;
            }>;
          };
        }
      >;
      const globalPdfjsLib = win.pdfjsLib;

      if (typeof globalPdfjsLib === "undefined") {
        console.warn("PDF.js not loaded");
        return "";
      }

      const pdf = await globalPdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (item as { str: string }).str)
          .join(" ");

        const annotations = await page.getAnnotations();
        const links = annotations
          .filter((anno) => anno.subtype === "Link" && anno.url)
          .map((anno) => anno.url)
          .join(" ");

        fullText += pageText + "\n\n";
        if (links) {
          fullText += "Embedded Document Links:\n" + links + "\n\n";
        }
      }
      return fullText;
    } catch (e) {
      console.error("PDF text extraction failed", e);
      return "";
    }
  };

  const processDocument = async (
    file: File,
  ): Promise<{ text: string; base64?: string; mimeType?: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type === "application/pdf") {
        reader.onload = async (ev) => {
          if (ev.target?.result) {
            try {
              const arrayBuffer = ev.target.result as ArrayBuffer;
              
              // 1. Convert to Base64 BEFORE pdf.js consumes the ArrayBuffer
              let binary = "";
              const bytes = new Uint8Array(arrayBuffer);
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Str = btoa(binary);

              // 2. Transmit buffer to PDF.js worker (this detaches the buffer)
              const extractedText = await extractPdfText(arrayBuffer);

              resolve({
                text: extractedText,
                base64: base64Str,
                mimeType: "application/pdf",
              });
            } catch (e) {
              reject(e);
            }
          } else reject(new Error("Failed to read file"));
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith(".docx")) {
        reader.onload = async (ev) => {
          if (ev.target?.result) {
            try {
              const arrayBuffer = ev.target.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              resolve({ text: result.value });
            } catch {
              reject(new Error("Failed to read DOCX file."));
            }
          } else reject(new Error("Failed to read file"));
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Plain text
        reader.onload = (ev) => {
          if (ev.target?.result) resolve({ text: ev.target.result as string });
          else reject(new Error("Failed to read file"));
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    // Filter to valid file types
    const validExtensions = [".pdf", ".docx", ".txt", ".md"];
    const validFiles = Array.from(e.target.files).filter(file => {
      return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || file.type === "application/pdf";
    });

    const newFiles = validFiles.map((file) => ({
      id: uuidv4(),
      file,
      status: "pending" as FileStatus,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = ""; // clear so identical files can be selected again
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const pendingFiles = files.filter(
      (f) => f.status === "pending" || f.status === "error",
    );

    // Run concurrently for all pending files
    await Promise.allSettled(
      pendingFiles.map(async (entry) => {
        try {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "processing", progress: "Reading file..." }
                : f,
            ),
          );

          const docData = await processDocument(entry.file);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, progress: "Analyzing via AI..." }
                : f,
            ),
          );

          const inputForParsing =
            docData.base64 && !docData.text
              ? { base64: docData.base64, mimeType: docData.mimeType! }
              : docData.text;
              
          if (!inputForParsing) throw new Error("No readable text found.");

          const parsedData = await parseResumeText(inputForParsing);
          const rawTextForStorage =
            docData.text || `[Content Processed via OCR]\n\n${parsedData.summary}`;

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, progress: "Saving..." } : f,
            ),
          );
          
          // NEW: Upload file to GridFS if it's a PDF
          let fileId: string | undefined = undefined;
          if (entry.file.type === "application/pdf") {
            try {
              const uploadRes = await uploadFile(entry.file);
              fileId = uploadRes.fileId;
            } catch (uploadError) {
              console.error("GridFS Upload failed, continuing without file storage", uploadError);
            }
          }

          const candidate = await addOrUpdateCandidate(
            parsedData,
            rawTextForStorage,
            referrer || "System",
            fileId,
          );

          if (!candidate) throw new Error("Failed to save to database");

          // Use custom uuid id if present, fallback to MongoDB _id
          const navId =
            (candidate as unknown as Record<string, string>)["id"] ||
            (candidate as unknown as Record<string, string>)["_id"];

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "success", candidateId: navId }
                : f,
            ),
          );
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to process";
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: "error",
                    error: errorMessage,
                  }
                : f,
            ),
          );
        }
      }),
    );

    setIsProcessing(false);
  };

  const isAllComplete = files.length > 0 && files.every(f => f.status === "success" || f.status === "error");
  const hasPending = files.some(f => f.status === "pending" || f.status === "error");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Resumes</h1>
        <p className="text-gray-500">
          Upload PDF, DOCX, or Text files to automatically extract candidate data. You can select multiple files at once.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* File Input Dropzone */}
        <div
          className={clsx(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors relative group",
            files.length > 0
              ? "border-indigo-300 bg-indigo-50"
              : "border-gray-300 hover:bg-gray-50",
          )}
        >
          <input
            type="file"
            accept=".txt,.md,.pdf,.docx"
            multiple
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center space-y-2 pointer-events-none">
            <div
              className={clsx(
                "p-3 rounded-full transition-colors",
                files.length > 0
                  ? "bg-white text-indigo-600"
                  : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
              )}
            >
              {files.length > 0 ? (
                <FileType className="w-6 h-6" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <p className="font-medium text-gray-900">
              {files.length > 0
                ? "Click or drag to add more files"
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOCX, TXT or MD supported (Multiple allowed)
            </p>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Selected Files ({files.length})</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileType className={clsx("w-5 h-5 flex-shrink-0", f.status === "error" ? "text-red-400" : f.status === "success" ? "text-green-500" : "text-indigo-500")} />
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {f.file.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {f.status === "processing" ? (
                          <span className="text-indigo-600 font-medium tracking-wide">
                            {f.progress}
                          </span>
                        ) : f.status === "error" ? (
                          <span className="text-red-500 font-medium truncate flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {f.error}
                          </span>
                        ) : f.status === "success" ? (
                          <span className="text-green-600 font-medium">Successfully Imported</span>
                        ) : (
                          "Pending"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.status === "success" && f.candidateId && (
                      <button
                        onClick={() => navigate(`/candidates/${f.candidateId}`)}
                        className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                         View <ExternalLink className="w-3 h-3"/>
                      </button>
                    )}
                    {(f.status === "pending" || f.status === "error") && (
                      <button
                        onClick={() => removeFile(f.id)}
                        disabled={isProcessing}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {f.status === "processing" && (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    )}
                    {f.status === "success" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referrer Input */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referred By (Optional)
          </label>
          <input
            type="text"
            value={referrer}
            onChange={(e) => setReferrer(e.target.value)}
            disabled={isProcessing}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white text-gray-900 disabled:bg-gray-50"
            placeholder="Recruiter Name or Source Tracker"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !hasPending || files.length === 0}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all",
              isProcessing || !hasPending || files.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg",
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing {files.filter(f => f.status === "processing" || f.status === "pending").length} Files...
              </>
            ) : isAllComplete ? (
               <>
                <CheckCircle className="w-5 h-5" />
                All Done
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Process {files.filter(f => f.status === "pending" || f.status === "error").length} Resumes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeIngest;
