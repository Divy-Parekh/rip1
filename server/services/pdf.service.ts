import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

/**
 * Service to handle advanced PDF parsing using pdfjs-dist.
 * Extracts both text and embedded hyperlinks (annotations).
 */

// In a Node environment, we need to provide a string path to the worker file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.resolve(__dirname, "../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
(pdfjs as any).GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();

export const extractPdfData = async (buffer: Buffer) => {
  try {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true, // Recommended for Node to avoid canvas issues if not present
    });

    const pdfDocument = await loadingTask.promise;
    let fullText = "";
    const extractedLinks: string[] = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      
      // 1. Extract Text
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";

      // 2. Extract Embedded Links (Annotations)
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann.subtype === "Link" && ann.url) {
          extractedLinks.push(ann.url);
        }
      }
    }

    return {
      text: fullText,
      links: Array.from(new Set(extractedLinks)), // Remove duplicates
    };
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract data from PDF");
  }
};
