import { PDFParse } from "pdf-parse";

/**
 * Service to handle PDF parsing using the modern pdf-parse fork.
 * Extracts text and metadata from resume buffers.
 */
export const extractPdfData = async (buffer: Buffer) => {
  try {
    // Convert Buffer to Uint8Array as expected by some newer PDF libraries
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    
    // Extract text content
    const textResult = await parser.getText();
    
    return {
      text: textResult.text || "",
      links: [], 
    };
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return {
      text: "",
      links: [],
    };
  }
};
