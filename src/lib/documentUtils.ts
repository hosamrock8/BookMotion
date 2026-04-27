import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Initialize pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPdf(file: File): Promise<string> {
  console.log(`[PDF Extraction] Starting for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log("[PDF Extraction] ArrayBuffer loaded, initializing pdfjs...");
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    console.log(`[PDF Extraction] PDF loaded. Total pages: ${pdf.numPages}`);
    
    let fullText = '';
    // Limit to first 30 pages for analysis, which is usually sufficient for a summary
    const numPages = Math.min(pdf.numPages, 30);
    
    for (let i = 1; i <= numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
            if (i % 5 === 0) console.log(`[PDF Extraction] Processed ${i}/${numPages} pages...`);
        } catch (pageErr) {
            console.error(`[PDF Extraction] Error on page ${i}:`, pageErr);
        }
    }
    
    const trimmedText = fullText.trim();
    if (!trimmedText) throw new Error("Document appears to be empty or contains only images (OCR not supported yet).");
    
    console.log(`[PDF Extraction] Completed. Extracted ${trimmedText.length} characters.`);
    return trimmedText;
  } catch (error) {
    console.error("PDF Extraction Critical Error:", error);
    if (error instanceof Error && error.message.includes("Worker")) {
      throw new Error("Neural Link Fault: PDF Worker failed to initialize. Please refresh the page and try again.");
    }
    throw new Error("فشل استخراج النص من ملف PDF. يرجى التأكد من أن الملف غير محمي بكلمة سر.");
  }
}

export async function extractTextFromEpub(file: File): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(file);
    let fullText = '';
    
    // Heuristic: EPUB content is in .html or .xhtml files
    // We sort them to try and keep some narrative order
    const htmlFiles = Object.keys(zip.files)
      .filter(name => name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.xhtml'))
      .sort();

    for (const name of htmlFiles) {
      const content = await zip.files[name].async('text');
      // Simple regex to strip HTML tags for summary analysis
      const plainText = content.replace(/<[^>]*>?/gm, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
      
      fullText += plainText + '\n';
      
      // Stop early if we have enough context (approx 15k chars is plenty for a 3-act summary)
      if (fullText.length > 15000) break;
    }
    
    return fullText;
  } catch (error) {
    console.error('Error parsing EPUB:', error);
    throw new Error('Could not extract text from EPUB file.');
  }
}
