'use client';

import { useState, useCallback } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { FileProcessor } from '@/components/tools/FileProcessor';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { ProcessingResult } from '@/types/file';
import { generateOutputFilename } from '@/lib/utils/download';

// Get tool configuration
const tool = getToolBySlug('pdf-to-word')!;
const seo = getToolSEO('pdf-to-word')!;

/**
 * PDF to Word Tool Page
 * Converts PDF documents to editable Word files
 * 
 * Requirements: 4.1, 6.1-6.7
 */
export default function PdfToWordPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    updateFileStatus,
    updateFileProgress,
  } = useFileUpload({ maxFiles: tool.maxFiles });

  /**
   * Handle file selection from dropzone
   */
  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      // Clear previous result when new files are selected
      setResult(null);
      addFiles(selectedFiles);
    },
    [addFiles]
  );

  /**
   * Process the PDF file and convert to Word
   */
  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0) {
      return { success: false, error: 'No file selected' };
    }

    const file = files[0];
    setIsProcessing(true);
    setResult(null);

    try {
      // Update file status to processing
      updateFileStatus(file.id, 'processing');
      updateFileProgress(file.id, 10);

      // Create form data for API request
      const formData = new FormData();
      formData.append('file', file.data as File);

      updateFileProgress(file.id, 30);

      // Send to API
      const response = await fetch('/api/convert/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      updateFileProgress(file.id, 70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Conversion failed');
      }

      // Get the converted file
      const arrayBuffer = await response.arrayBuffer();
      // Create blob with explicit MIME type for DOCX
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const outputFilename = response.headers.get('X-Output-Filename') || 
        generateOutputFilename(file.name, '.docx');

      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      updateFileStatus(file.id, 'error', errorMessage);

      const processingResult: ProcessingResult = {
        success: false,
        error: errorMessage,
      };

      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, updateFileStatus, updateFileProgress]);

  /**
   * Handle clearing files and resetting state
   */
  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
  }, [clearFiles]);

  // Custom content sections for SEO (1200-1800 words total)
  const contentSections = [
    {
      heading: 'About PDF to Word Conversion',
      content: `
        <p>Converting PDF to Word is one of the most common document conversion tasks in today's digital workplace. 
        Whether you need to edit a contract, update a report, modify a presentation, or extract content from a research paper, 
        AdobeWork makes it easy to transform your PDF files into fully editable Word documents in just seconds.</p>
        <p>Our PDF to Word converter uses advanced text extraction technology to preserve the original formatting, including fonts, 
        images, tables, and layout, so you can start editing immediately without having to recreate the document from scratch. 
        This saves you valuable time and ensures accuracy when working with important documents.</p>
        <p>Unlike many other online converters, AdobeWork processes your files securely and never stores your documents permanently. 
        All uploaded files are automatically deleted within one hour, giving you peace of mind when converting sensitive business documents, 
        legal contracts, or personal files.</p>
      `,
    },
    {
      heading: 'When to Use PDF to Word Conversion',
      content: `
        <p>PDF to Word conversion is ideal for a wide variety of use cases:</p>
        <ul>
          <li><strong>Editing documents</strong> - Make changes to contracts, reports, proposals, or any PDF content that needs updating. 
          Word's editing capabilities make it easy to modify text, adjust formatting, and add new content.</li>
          <li><strong>Extracting content</strong> - Copy text, images, and tables from PDFs for use in other documents, presentations, 
          or spreadsheets. This is particularly useful for research, content repurposing, and data analysis.</li>
          <li><strong>Updating templates</strong> - Modify PDF templates for new projects without starting from scratch. 
          Convert the template to Word, make your changes, and export back to PDF if needed.</li>
          <li><strong>Collaboration</strong> - Share editable versions with team members who need to contribute to or review documents. 
          Word's track changes and commenting features make collaboration seamless.</li>
          <li><strong>Accessibility</strong> - Convert PDFs to more accessible formats for users who rely on screen readers or other 
          assistive technologies. Word documents often provide better accessibility support than PDFs.</li>
          <li><strong>Form filling</strong> - Convert PDF forms to Word to easily fill in information, especially when the original 
          PDF doesn't have fillable form fields.</li>
          <li><strong>Translation</strong> - Convert PDFs to Word before using translation tools, as many translation services 
          work better with editable document formats.</li>
        </ul>
      `,
    },
    {
      heading: 'How Our PDF to Word Converter Works',
      content: `
        <p>AdobeWork's PDF to Word converter uses a sophisticated multi-step process to ensure high-quality conversions:</p>
        <ol>
          <li><strong>Text Extraction</strong> - Our system analyzes the PDF structure and extracts all text content while 
          preserving the reading order and paragraph structure.</li>
          <li><strong>Layout Analysis</strong> - The converter identifies headings, paragraphs, lists, and other structural 
          elements to maintain the document's organization.</li>
          <li><strong>Formatting Preservation</strong> - Font styles, sizes, colors, and text formatting are detected and 
          applied to the Word output.</li>
          <li><strong>Document Generation</strong> - A properly formatted DOCX file is created that can be opened in 
          Microsoft Word, Google Docs, LibreOffice, or any other word processor that supports the format.</li>
        </ol>
        <p>The entire process typically takes just a few seconds, even for longer documents. Our servers are optimized 
        for fast processing while maintaining conversion quality.</p>
      `,
    },
    {
      heading: 'Tips for Best Conversion Results',
      content: `
        <p>To get the best results when converting PDF to Word, keep these tips in mind:</p>
        <ul>
          <li><strong>Use text-based PDFs</strong> - PDFs created from digital documents (like Word files or web pages) 
          convert better than scanned documents. If you have a scanned PDF, consider using OCR software first.</li>
          <li><strong>Check the source quality</strong> - Higher quality source PDFs produce better conversions. 
          If possible, obtain the original document or a high-resolution PDF.</li>
          <li><strong>Simple layouts convert best</strong> - Documents with straightforward layouts (single columns, 
          standard formatting) typically convert more accurately than complex multi-column designs.</li>
          <li><strong>Review after conversion</strong> - Always review the converted document to check for any 
          formatting issues that may need manual adjustment.</li>
          <li><strong>Keep file sizes reasonable</strong> - While AdobeWork supports files up to 50MB, smaller files 
          process faster and often produce cleaner results.</li>
        </ul>
      `,
    },
    {
      heading: 'PDF to Word vs Other Conversion Options',
      content: `
        <p>When you need to work with PDF content, you have several options. Here's how PDF to Word conversion 
        compares to alternatives:</p>
        <p><strong>PDF to Word (DOCX)</strong> - Best for editing text-heavy documents, making substantial changes, 
        or when you need full word processing capabilities. Word format is widely supported and offers excellent 
        editing features.</p>
        <p><strong>PDF Editing</strong> - If you only need to make minor changes (like filling in a form or adding 
        a signature), using a PDF editor might be simpler. However, PDF editors have limited text editing capabilities 
        compared to Word.</p>
        <p><strong>Copy and Paste</strong> - For extracting small amounts of text, copying from the PDF might work. 
        However, this often loses formatting and doesn't work well with complex layouts or images.</p>
        <p><strong>PDF to Google Docs</strong> - Google Docs can open PDFs directly, but the conversion quality 
        varies. For important documents, a dedicated converter like AdobeWork typically produces better results.</p>
        <p>For most editing tasks, converting PDF to Word provides the best balance of quality, flexibility, and 
        ease of use.</p>
      `,
    },
    {
      heading: 'Security and Privacy',
      content: `
        <p>At AdobeWork, we take the security and privacy of your documents seriously:</p>
        <ul>
          <li><strong>Encrypted transfers</strong> - All file uploads and downloads use HTTPS encryption to protect 
          your data in transit.</li>
          <li><strong>Automatic deletion</strong> - Uploaded files are automatically deleted from our servers within 
          one hour of processing. We never store your documents permanently.</li>
          <li><strong>No account required</strong> - You can convert files without creating an account or providing 
          personal information.</li>
          <li><strong>Server-side processing</strong> - Your files are processed on secure servers and never shared 
          with third parties.</li>
          <li><strong>No watermarks</strong> - Unlike some free converters, AdobeWork never adds watermarks to your 
          converted documents.</li>
        </ul>
        <p>These security measures make AdobeWork suitable for converting business documents, legal contracts, 
        financial reports, and other sensitive materials.</p>
      `,
    },
    {
      heading: 'Supported File Formats',
      content: `
        <p>AdobeWork's PDF to Word converter accepts standard PDF files and produces Microsoft Word DOCX format output:</p>
        <p><strong>Input:</strong> PDF (.pdf) - All standard PDF files are supported, including those created by 
        Adobe Acrobat, Microsoft Office, web browsers, and other PDF creation tools.</p>
        <p><strong>Output:</strong> DOCX (.docx) - The output format is compatible with:</p>
        <ul>
          <li>Microsoft Word 2007 and later</li>
          <li>Google Docs</li>
          <li>LibreOffice Writer</li>
          <li>Apple Pages</li>
          <li>WPS Office</li>
          <li>And most other modern word processors</li>
        </ul>
        <p>The DOCX format is the modern standard for word processing documents, offering excellent compatibility 
        and support for advanced formatting features.</p>
      `,
    },
  ];

  return (
    <ToolPageLayout tool={tool} seo={seo} contentSections={contentSections}>
      <div className="space-y-6">
        {/* File Upload Area */}
        {files.length === 0 && (
          <FileDropzone
            acceptedFormats={tool.acceptedFormats}
            maxFileSize={tool.maxFileSize}
            maxFiles={tool.maxFiles}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
          />
        )}

        {/* File Processor */}
        {files.length > 0 && (
          <FileProcessor
            tool={tool}
            files={files}
            onProcess={handleProcess}
            onRemoveFile={removeFile}
            onClearFiles={handleClearFiles}
            isProcessing={isProcessing}
            result={result}
          />
        )}
      </div>
    </ToolPageLayout>
  );
}
