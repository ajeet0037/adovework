'use client';

import { useState, useCallback } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { FileProcessor } from '@/components/tools/FileProcessor';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { ProcessingResult } from '@/types/file';
import { imagesToPdf, detectImageFormat, SupportedImageFormat } from '@/lib/converters/imageToPdf';

// Get tool configuration
const tool = getToolBySlug('image-to-pdf')!;
const seo = getToolSEO('image-to-pdf')!;

/**
 * Image to PDF Tool Page
 * Converts JPG and PNG images to PDF documents (client-side processing)
 * 
 * Requirements: 4.3, 6.1-6.7
 */
export default function ImageToPdfPage() {
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
   * Process images and convert to PDF (client-side)
   */
  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0) {
      return { success: false, error: 'No files selected' };
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Update all files to processing
      files.forEach(file => {
        updateFileStatus(file.id, 'processing');
        updateFileProgress(file.id, 0);
      });

      // Read all image files
      const imageData: Array<{ buffer: ArrayBuffer; mimeType: SupportedImageFormat }> = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileData = file.data as File;
        
        updateFileProgress(file.id, 20);
        
        const buffer = await fileData.arrayBuffer();
        const format = detectImageFormat(buffer);
        
        if (!format) {
          throw new Error(`Unsupported image format for file: ${file.name}`);
        }
        
        imageData.push({ buffer, mimeType: format });
        updateFileProgress(file.id, 50);
      }

      // Convert images to PDF
      const pdfBytes = await imagesToPdf(imageData);
      
      // Update all files to completed
      files.forEach(file => {
        updateFileProgress(file.id, 100);
        updateFileStatus(file.id, 'completed');
      });

      // Create blob for download - copy to new ArrayBuffer to ensure correct type
      const newBuffer = new ArrayBuffer(pdfBytes.byteLength);
      new Uint8Array(newBuffer).set(pdfBytes);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const outputFilename = files.length === 1 
        ? files[0].name.replace(/\.(jpg|jpeg|png)$/i, '.pdf')
        : 'images.pdf';

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      
      files.forEach(file => {
        updateFileStatus(file.id, 'error', errorMessage);
      });

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
      heading: 'About Image to PDF Conversion',
      content: `
        <p>Converting images to PDF is a common need for creating professional documents, portfolios, 
        presentations, and archives. AdobeWork makes it easy to transform your JPG and PNG images into 
        high-quality PDF documents directly in your browser.</p>
        <p>Our image to PDF converter processes files entirely on your device, ensuring your photos 
        and images never leave your computer. This provides maximum privacy and security while 
        delivering fast conversion speeds.</p>
        <p>Whether you need to combine multiple photos into a single document or convert a single 
        image for professional use, AdobeWork handles it all with ease.</p>
      `,
    },
    {
      heading: 'When to Use Image to PDF Conversion',
      content: `
        <p>Image to PDF conversion is useful for many scenarios:</p>
        <ul>
          <li><strong>Creating portfolios</strong> - Combine multiple images into a professional 
          PDF portfolio for sharing with clients or employers.</li>
          <li><strong>Document scanning</strong> - Convert photos of documents into PDF format 
          for easier sharing and archiving.</li>
          <li><strong>Photo albums</strong> - Create PDF photo albums that can be easily shared 
          or printed.</li>
          <li><strong>Presentations</strong> - Convert images to PDF for inclusion in reports 
          or presentations.</li>
          <li><strong>Archiving</strong> - Store images in PDF format for long-term preservation.</li>
          <li><strong>Email attachments</strong> - Combine multiple images into a single PDF 
          for easier email sharing.</li>
        </ul>
      `,
    },
    {
      heading: 'How Our Image to PDF Converter Works',
      content: `
        <p>AdobeWork's image to PDF converter uses client-side processing for maximum speed and privacy:</p>
        <ol>
          <li><strong>Upload Images</strong> - Select one or more JPG or PNG images from your device.</li>
          <li><strong>Arrange Order</strong> - Images are converted in the order they appear in the list.</li>
          <li><strong>Convert</strong> - Click the Process button to create your PDF.</li>
          <li><strong>Download</strong> - Your PDF is ready for immediate download.</li>
        </ol>
        <p>Each image becomes a separate page in the resulting PDF, maintaining the original 
        image quality and aspect ratio.</p>
      `,
    },
    {
      heading: 'Tips for Best Results',
      content: `
        <p>To get the best results when converting images to PDF:</p>
        <ul>
          <li><strong>Use high-quality images</strong> - Higher resolution images produce better PDF output.</li>
          <li><strong>Consistent orientation</strong> - For best results, use images with the same orientation.</li>
          <li><strong>Supported formats</strong> - Use JPG or PNG format for best compatibility.</li>
          <li><strong>File order</strong> - Upload images in the order you want them to appear in the PDF.</li>
          <li><strong>File size</strong> - Each image can be up to 50MB, with up to 20 images per conversion.</li>
        </ul>
      `,
    },
    {
      heading: 'Privacy and Security',
      content: `
        <p>Your images are processed entirely in your browser:</p>
        <ul>
          <li><strong>No upload to servers</strong> - Images never leave your device.</li>
          <li><strong>Client-side processing</strong> - All conversion happens locally.</li>
          <li><strong>No data collection</strong> - We don't store or access your images.</li>
          <li><strong>Instant processing</strong> - No waiting for server responses.</li>
        </ul>
      `,
    },
    {
      heading: 'Supported Formats',
      content: `
        <p><strong>Input formats:</strong></p>
        <ul>
          <li>JPEG/JPG - Standard photo format</li>
          <li>PNG - Supports transparency</li>
        </ul>
        <p><strong>Output:</strong> PDF (.pdf) - Universal document format compatible with all PDF readers.</p>
        <p><strong>Limits:</strong> Up to 20 images per conversion, 50MB per image.</p>
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
          <>
            {/* Additional upload area when files exist */}
            {files.length < tool.maxFiles && !isProcessing && (
              <div className="mb-4">
                <FileDropzone
                  acceptedFormats={tool.acceptedFormats}
                  maxFileSize={tool.maxFileSize}
                  maxFiles={tool.maxFiles - files.length}
                  onFilesSelected={handleFilesSelected}
                  disabled={isProcessing}
                />
              </div>
            )}
            
            <FileProcessor
              tool={tool}
              files={files}
              onProcess={handleProcess}
              onRemoveFile={removeFile}
              onClearFiles={handleClearFiles}
              isProcessing={isProcessing}
              result={result}
            />
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
