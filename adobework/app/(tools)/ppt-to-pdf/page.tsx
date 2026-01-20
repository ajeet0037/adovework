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
const tool = getToolBySlug('ppt-to-pdf')!;
const seo = getToolSEO('ppt-to-pdf')!;

/**
 * PowerPoint to PDF Tool Page
 * Converts PowerPoint presentations to PDF format
 * 
 * Requirements: 5.2, 6.1-6.7
 */
export default function PptToPdfPage() {
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

      const response = await fetch('/api/convert/ppt-to-pdf', {
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
      heading: 'About PowerPoint to PDF Conversion',
      content: `
        <p>Converting PowerPoint to PDF is essential for sharing presentations in a universal, 
        non-editable format. Whether you're distributing slides to clients, archiving presentations, 
        or ensuring consistent formatting across devices, AdobeWork makes it easy to transform your 
        PPTX files into professional PDF documents.</p>
        <p>Our converter preserves your slide content, text formatting, and layout while creating 
        a PDF that looks great on any device and can be easily shared via email or cloud storage.</p>
      `,
    },
    {
      heading: 'When to Use PowerPoint to PDF Conversion',
      content: `
        <p>PowerPoint to PDF conversion is ideal for:</p>
        <ul>
          <li><strong>Sharing presentations</strong> - Send slides that look the same on any device</li>
          <li><strong>Archiving</strong> - Create permanent records of presentations</li>
          <li><strong>Printing</strong> - Generate print-ready versions of your slides</li>
          <li><strong>Email attachments</strong> - Share smaller, more compatible files</li>
          <li><strong>Preventing edits</strong> - Distribute read-only versions of your work</li>
        </ul>
      `,
    },
    {
      heading: 'How Our Converter Works',
      content: `
        <p>AdobeWork's PowerPoint to PDF converter processes your presentation:</p>
        <ol>
          <li><strong>File Parsing</strong> - Your PPTX file is analyzed and parsed</li>
          <li><strong>Content Extraction</strong> - Text and layout information is extracted</li>
          <li><strong>PDF Generation</strong> - Each slide becomes a PDF page</li>
          <li><strong>Output Creation</strong> - A high-quality PDF is generated</li>
        </ol>
      `,
    },
    {
      heading: 'Tips for Best Results',
      content: `
        <p>To get the best conversion results:</p>
        <ul>
          <li><strong>Use PPTX format</strong> - Modern .pptx files convert best</li>
          <li><strong>Embed fonts</strong> - Ensure fonts display correctly in the PDF</li>
          <li><strong>Check slide content</strong> - Review slides before conversion</li>
          <li><strong>Note limitations</strong> - Animations and videos won't transfer to PDF</li>
        </ul>
      `,
    },
    {
      heading: 'Security and Privacy',
      content: `
        <p>Your presentations are handled securely:</p>
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
