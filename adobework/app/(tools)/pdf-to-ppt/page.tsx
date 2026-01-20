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
const tool = getToolBySlug('pdf-to-ppt')!;
const seo = getToolSEO('pdf-to-ppt')!;

/**
 * PDF to PowerPoint Tool Page
 * Converts PDF documents to editable PowerPoint presentations
 * 
 * Requirements: 5.1, 6.1-6.7
 */
export default function PdfToPptPage() {
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

      const response = await fetch('/api/convert/pdf-to-ppt', {
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
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
      const outputFilename = response.headers.get('X-Output-Filename') || 
        generateOutputFilename(file.name, '.pptx');

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
      heading: 'About PDF to PowerPoint Conversion',
      content: `
        <p>Converting PDF to PowerPoint is essential for professionals who need to repurpose document content into 
        presentation format. Whether you're preparing for a meeting, creating training materials, or adapting 
        reports for stakeholder presentations, AdobeWork makes it easy to transform your PDF files into editable 
        PowerPoint slides in seconds.</p>
        <p>Our PDF to PowerPoint converter extracts text content from each PDF page and creates corresponding 
        slides, preserving the document structure and making it easy to edit and customize your presentation.</p>
      `,
    },
    {
      heading: 'When to Use PDF to PowerPoint Conversion',
      content: `
        <p>PDF to PowerPoint conversion is ideal for:</p>
        <ul>
          <li><strong>Meeting preparation</strong> - Transform reports and documents into presentation-ready slides</li>
          <li><strong>Training materials</strong> - Convert documentation into engaging training presentations</li>
          <li><strong>Content repurposing</strong> - Adapt existing PDF content for different audiences</li>
          <li><strong>Collaboration</strong> - Share editable presentations with team members</li>
          <li><strong>Quick edits</strong> - Make changes to PDF content using PowerPoint's editing tools</li>
        </ul>
      `,
    },
    {
      heading: 'How Our Converter Works',
      content: `
        <p>AdobeWork's PDF to PowerPoint converter uses a multi-step process:</p>
        <ol>
          <li><strong>Content Extraction</strong> - Text and structure are extracted from each PDF page</li>
          <li><strong>Slide Creation</strong> - Each PDF page becomes a PowerPoint slide</li>
          <li><strong>Layout Optimization</strong> - Content is arranged for optimal presentation display</li>
          <li><strong>File Generation</strong> - A fully editable PPTX file is created</li>
        </ol>
      `,
    },
    {
      heading: 'Tips for Best Results',
      content: `
        <p>To get the best conversion results:</p>
        <ul>
          <li><strong>Use text-based PDFs</strong> - Digital PDFs convert better than scanned documents</li>
          <li><strong>Simple layouts work best</strong> - Complex multi-column layouts may need manual adjustment</li>
          <li><strong>Review after conversion</strong> - Check slides and adjust formatting as needed</li>
          <li><strong>Keep files reasonable</strong> - Smaller PDFs process faster and more accurately</li>
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
