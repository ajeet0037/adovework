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
const tool = getToolBySlug('pdf-to-excel')!;
const seo = getToolSEO('pdf-to-excel')!;

/**
 * PDF to Excel Tool Page
 * Extracts tables from PDF documents and converts to Excel spreadsheets
 * 
 * Requirements: 5.3, 6.1-6.7
 */
export default function PdfToExcelPage() {
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

      const response = await fetch('/api/convert/pdf-to-excel', {
        method: 'POST',
        body: formData,
      });

      updateFileProgress(file.id, 70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Conversion failed');
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const outputFilename = response.headers.get('X-Output-Filename') || 
        generateOutputFilename(file.name, '.xlsx');

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
      heading: 'About PDF to Excel Conversion',
      content: `
        <p>Converting PDF to Excel is essential for extracting tabular data from documents. 
        Whether you're working with financial reports, invoices, data tables, or any PDF 
        containing structured information, AdobeWork makes it easy to transform your PDF 
        tables into editable Excel spreadsheets.</p>
        <p>Our PDF to Excel converter uses intelligent table detection to identify rows and 
        columns in your PDF, creating a properly formatted spreadsheet that's ready for 
        analysis, editing, or further processing.</p>
      `,
    },
    {
      heading: 'When to Use PDF to Excel Conversion',
      content: `
        <p>PDF to Excel conversion is ideal for:</p>
        <ul>
          <li><strong>Data extraction</strong> - Pull numbers and text from PDF tables into spreadsheets</li>
          <li><strong>Financial analysis</strong> - Convert financial reports for calculations and charts</li>
          <li><strong>Invoice processing</strong> - Extract line items from PDF invoices</li>
          <li><strong>Research data</strong> - Convert research tables for statistical analysis</li>
          <li><strong>Report compilation</strong> - Combine data from multiple PDF sources</li>
        </ul>
      `,
    },
    {
      heading: 'How Our Converter Works',
      content: `
        <p>AdobeWork's PDF to Excel converter uses advanced table detection:</p>
        <ol>
          <li><strong>Content Analysis</strong> - Text positions are analyzed to detect table structure</li>
          <li><strong>Column Detection</strong> - Vertical alignment patterns identify columns</li>
          <li><strong>Row Grouping</strong> - Horizontal alignment groups text into rows</li>
          <li><strong>Excel Generation</strong> - Data is organized into a properly formatted spreadsheet</li>
        </ol>
      `,
    },
    {
      heading: 'Tips for Best Results',
      content: `
        <p>To get the best conversion results:</p>
        <ul>
          <li><strong>Use text-based PDFs</strong> - Digital PDFs with selectable text work best</li>
          <li><strong>Clear table structure</strong> - Well-defined tables convert more accurately</li>
          <li><strong>Simple layouts</strong> - Single tables per page produce cleaner results</li>
          <li><strong>Review output</strong> - Check the Excel file and adjust formatting as needed</li>
        </ul>
      `,
    },
    {
      heading: 'Security and Privacy',
      content: `
        <p>Your documents are handled securely:</p>
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
