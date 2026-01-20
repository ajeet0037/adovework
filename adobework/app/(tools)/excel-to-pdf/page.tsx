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
const tool = getToolBySlug('excel-to-pdf')!;
const seo = getToolSEO('excel-to-pdf')!;

/**
 * Excel to PDF Tool Page
 * Converts Excel spreadsheets to PDF format
 * 
 * Requirements: 5.4, 6.1-6.7
 */
export default function ExcelToPdfPage() {
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

  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      setResult(null);
      addFiles(selectedFiles);
    },
    [addFiles]
  );

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

      const response = await fetch('/api/convert/excel-to-pdf', {
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

  const contentSections = [
    {
      heading: 'About Excel to PDF Conversion',
      content: `
        <p>Converting Excel to PDF is essential for sharing spreadsheets in a universal, 
        print-ready format. Whether you're distributing financial reports, sharing data 
        with clients, or archiving spreadsheets, AdobeWork makes it easy to transform your 
        Excel files into professional PDF documents.</p>
        <p>Our converter preserves your cell formatting, borders, colors, and layout while 
        creating a PDF that looks great on any device and can be easily printed or shared.</p>
      `,
    },
    {
      heading: 'When to Use Excel to PDF Conversion',
      content: `
        <p>Excel to PDF conversion is ideal for:</p>
        <ul>
          <li><strong>Report distribution</strong> - Share financial reports in a fixed format</li>
          <li><strong>Printing</strong> - Create print-ready versions of spreadsheets</li>
          <li><strong>Archiving</strong> - Preserve spreadsheets in a universal format</li>
          <li><strong>Client sharing</strong> - Send data without allowing edits</li>
          <li><strong>Email attachments</strong> - Share smaller, more compatible files</li>
        </ul>
      `,
    },
    {
      heading: 'How Our Converter Works',
      content: `
        <p>AdobeWork's Excel to PDF converter processes your spreadsheet:</p>
        <ol>
          <li><strong>File Parsing</strong> - Your XLSX file is analyzed and parsed</li>
          <li><strong>Content Extraction</strong> - Cell values, formatting, and structure are extracted</li>
          <li><strong>Layout Rendering</strong> - Tables are rendered with proper formatting</li>
          <li><strong>PDF Generation</strong> - Each sheet becomes a section in the PDF</li>
        </ol>
      `,
    },
    {
      heading: 'Tips for Best Results',
      content: `
        <p>To get the best conversion results:</p>
        <ul>
          <li><strong>Use XLSX format</strong> - Modern .xlsx files convert best</li>
          <li><strong>Set print area</strong> - Define the area you want to convert</li>
          <li><strong>Check column widths</strong> - Ensure all content is visible</li>
          <li><strong>Review formatting</strong> - Cell colors and borders will be preserved</li>
        </ul>
      `,
    },
    {
      heading: 'Security and Privacy',
      content: `
        <p>Your spreadsheets are handled securely:</p>
        <ul>
          <li><strong>Encrypted transfers</strong> - All uploads use HTTPS encryption</li>
          <li><strong>Automatic deletion</strong> - Files are deleted within 1 hour</li>
          <li><strong>No permanent storage</strong> - We never store your documents</li>
          <li><strong>No watermarks</strong> - Your converted files are clean and professional</li>
        </ul>
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
