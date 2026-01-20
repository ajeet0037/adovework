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
const tool = getToolBySlug('word-to-pdf')!;
const seo = getToolSEO('word-to-pdf')!;

/**
 * Word to PDF Tool Page
 * Converts Word documents to PDF format
 * 
 * Requirements: 4.2, 6.1-6.7
 */
export default function WordToPdfPage() {
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
      setResult(null);
      addFiles(selectedFiles);
    },
    [addFiles]
  );

  /**
   * Process the Word file and convert to PDF
   */
  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0) {
      return { success: false, error: 'No file selected' };
    }

    const file = files[0];
    setIsProcessing(true);
    setResult(null);

    try {
      updateFileStatus(file.id, 'processing');
      updateFileProgress(file.id, 10);

      const formData = new FormData();
      formData.append('file', file.data as File);

      updateFileProgress(file.id, 30);

      const response = await fetch('/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });

      updateFileProgress(file.id, 70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Conversion failed');
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const outputFilename = response.headers.get('X-Output-Filename') || 
        generateOutputFilename(file.name, '.pdf');

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

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
  }, [clearFiles]);

  // SEO content sections
  const contentSections = [
    {
      heading: 'About Word to PDF Conversion',
      content: `
        <p>Converting Word documents to PDF is essential for sharing professional documents that maintain their 
        formatting across all devices and platforms. AdobeWork makes it easy to transform your DOCX files into 
        universally readable PDF documents in just seconds.</p>
        <p>Our Word to PDF converter preserves your document's text, paragraphs, headings, and structure, 
        ensuring your content looks professional when shared with colleagues, clients, or for archival purposes.</p>
        <p>Unlike desktop software, AdobeWork works entirely in your browser with no installation required. 
        Simply upload your Word document, click convert, and download your PDF instantly.</p>
      `,
    },
    {
      heading: 'When to Use Word to PDF Conversion',
      content: `
        <p>Word to PDF conversion is ideal for many professional and personal use cases:</p>
        <ul>
          <li><strong>Sharing documents</strong> - PDFs look the same on every device, ensuring your formatting 
          is preserved when sharing with others who may not have Microsoft Word.</li>
          <li><strong>Professional submissions</strong> - Many organizations require PDF format for resumes, 
          proposals, reports, and official documents.</li>
          <li><strong>Archiving</strong> - PDF is an excellent format for long-term document storage as it 
          preserves content integrity over time.</li>
          <li><strong>Printing</strong> - PDFs provide consistent print output regardless of the printer 
          or operating system used.</li>
          <li><strong>Email attachments</strong> - PDF files are universally supported and typically smaller 
          than Word documents with embedded images.</li>
          <li><strong>Legal documents</strong> - PDFs can be digitally signed and are widely accepted for 
          legal and official purposes.</li>
        </ul>
      `,
    },
    {
      heading: 'How Our Word to PDF Converter Works',
      content: `
        <p>AdobeWork's Word to PDF converter uses a sophisticated process to ensure high-quality conversions:</p>
        <ol>
          <li><strong>Document Parsing</strong> - Our system reads the Word document structure, extracting 
          text, headings, paragraphs, and formatting information.</li>
          <li><strong>Content Analysis</strong> - The converter identifies document elements like headings, 
          lists, and paragraphs to maintain proper structure.</li>
          <li><strong>PDF Generation</strong> - A properly formatted PDF is created with appropriate fonts, 
          spacing, and page layout.</li>
          <li><strong>Quality Check</strong> - The output PDF is validated to ensure it can be opened and 
          viewed correctly.</li>
        </ol>
        <p>The entire process typically takes just a few seconds, even for longer documents.</p>
      `,
    },
    {
      heading: 'Tips for Best Conversion Results',
      content: `
        <p>To get the best results when converting Word to PDF:</p>
        <ul>
          <li><strong>Use standard fonts</strong> - Documents using common fonts like Arial, Times New Roman, 
          or Calibri convert most reliably.</li>
          <li><strong>Keep formatting simple</strong> - Complex layouts with multiple columns or text boxes 
          may require adjustment after conversion.</li>
          <li><strong>Check headings</strong> - Use Word's built-in heading styles for best structure preservation.</li>
          <li><strong>Review before sharing</strong> - Always preview the converted PDF to ensure it meets 
          your expectations.</li>
          <li><strong>Use DOCX format</strong> - Modern .docx files convert better than older .doc formats.</li>
        </ul>
      `,
    },
    {
      heading: 'Security and Privacy',
      content: `
        <p>At AdobeWork, we take the security of your documents seriously:</p>
        <ul>
          <li><strong>Encrypted transfers</strong> - All file uploads use HTTPS encryption.</li>
          <li><strong>Automatic deletion</strong> - Files are automatically deleted within 1 hour.</li>
          <li><strong>No permanent storage</strong> - We never store your documents permanently.</li>
          <li><strong>No account required</strong> - Convert files without registration.</li>
          <li><strong>No watermarks</strong> - Your converted PDFs are clean and professional.</li>
        </ul>
      `,
    },
    {
      heading: 'Supported File Formats',
      content: `
        <p>AdobeWork's Word to PDF converter supports:</p>
        <p><strong>Input formats:</strong></p>
        <ul>
          <li>DOCX - Microsoft Word 2007 and later</li>
          <li>DOC - Legacy Microsoft Word format</li>
        </ul>
        <p><strong>Output:</strong> PDF (.pdf) - Compatible with all PDF readers including Adobe Acrobat, 
        web browsers, and mobile devices.</p>
      `,
    },
  ];

  return (
    <ToolPageLayout tool={tool} seo={seo} contentSections={contentSections}>
      <div className="space-y-6">
        {files.length === 0 && (
          <FileDropzone
            acceptedFormats={tool.acceptedFormats}
            maxFileSize={tool.maxFileSize}
            maxFiles={tool.maxFiles}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
          />
        )}

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
