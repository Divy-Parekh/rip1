
import React, { useState } from 'react';
import { parseResumeText } from '../services/geminiService';
import { addOrUpdateCandidate } from '../services/storageService';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, FileType } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

// Define pdfjsLib type for typescript (loaded via script tag)
declare const pdfjsLib: any;

const ResumeIngest: React.FC = () => {
  const navigate = useNavigate();
  const [text, setText] = useState(''); // Can store raw text or be empty if file is binary
  const [pdfFile, setPdfFile] = useState<{ base64: string; mimeType: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrer, setReferrer] = useState('');

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
        if (typeof pdfjsLib === 'undefined') {
            console.warn("PDF.js not loaded");
            return "";
        }
        
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + "\n\n";
        }
        return fullText;
    } catch (e) {
        console.error("PDF text extraction failed", e);
        return "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setError(null);
    setPdfFile(null);
    setText('');

    if (file.type === 'application/pdf') {
        // Handle PDF - Read as ArrayBuffer for text extraction, and later convert to Base64
        const reader = new FileReader();
        reader.onload = async (ev) => {
            if (ev.target?.result) {
                const arrayBuffer = ev.target.result as ArrayBuffer;
                
                // 1. Extract Raw Text for preview & storage
                const extractedText = await extractPdfText(arrayBuffer);
                setText(extractedText);

                // 2. Convert to Base64 for AI
                let binary = '';
                const bytes = new Uint8Array(arrayBuffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64String = btoa(binary);
                
                setPdfFile({
                    base64: base64String,
                    mimeType: 'application/pdf'
                });
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.docx')) {
        // Handle DOCX - Use Mammoth to extract raw text
        const reader = new FileReader();
        reader.onload = async (ev) => {
            if (ev.target?.result && (window as any).mammoth) {
                try {
                    const arrayBuffer = ev.target.result as ArrayBuffer;
                    const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
                    setText(result.value);
                } catch (err) {
                    setError("Failed to read DOCX file. Ensure it is not corrupted.");
                }
            } else if (!(window as any).mammoth) {
                 setError("DOCX parser (Mammoth.js) not loaded. Please refresh.");
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // Handle Text
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) setText(ev.target.result as string);
        };
        reader.readAsText(file);
    } else {
        setError("Unsupported file format. Please upload PDF, DOCX, or TXT.");
        setFileName(null);
    }
  };

  const handleSubmit = async () => {
    if (!text && !pdfFile) {
        setError("Please upload a resume or paste text.");
        return;
    }
    
    setError(null);
    setIsProcessing(true);

    try {
        // If we have a PDF, sending it as image/pdf part. If text, sending as text prompt.
        const input = pdfFile ? pdfFile : text;
        
        const parsedData = await parseResumeText(input);
        
        // Use the extracted text as the raw text (should be populated by extractPdfText or mammoth)
        // Fallback to summary if extraction completely failed but AI still worked on image
        const rawTextForStorage = text || `[Content Processed via OCR]\n\n${parsedData.summary}`;

        const candidate = addOrUpdateCandidate(parsedData, rawTextForStorage, referrer || 'System');
        navigate(`/candidates/${candidate.id}`);
    } catch (err) {
        setError("Failed to process resume. Please try again.");
        console.error(err);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Resume</h1>
        <p className="text-gray-500">Upload PDF, DOCX, or Text files to automatically extract candidate data.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        
        {/* File Input */}
        <div className={clsx(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors relative group",
            fileName ? "border-indigo-300 bg-indigo-50" : "border-gray-300 hover:bg-gray-50"
        )}>
            <input 
                type="file" 
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
                <div className={clsx(
                    "p-3 rounded-full transition-colors",
                    fileName ? "bg-white text-indigo-600" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                )}>
                    {fileName ? <FileType className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                </div>
                <p className="font-medium text-gray-900">
                    {fileName ? fileName : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-500">
                    {fileName ? "Click to change file" : "PDF, DOCX, TXT or MD supported"}
                </p>
            </div>
        </div>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">OR PASTE TEXT</span>
            </div>
        </div>

        {/* Text Area */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume Content</label>
            <textarea
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    setPdfFile(null);
                    setFileName(null);
                }}
                rows={10}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3 bg-white text-gray-900 font-mono text-xs"
                placeholder="Paste resume text here or upload a file to see extracted text..."
            />
        </div>

         {/* Referrer Input */}
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referred By (Optional)</label>
            <input
                type="text"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white text-gray-900"
                placeholder="Recruiter Name"
            />
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </div>
        )}

        <div className="flex justify-end">
            <button
                onClick={handleSubmit}
                disabled={isProcessing || (!text && !pdfFile)}
                className={clsx(
                    "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all",
                    isProcessing || (!text && !pdfFile) ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                )}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        Process Resume
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ResumeIngest;