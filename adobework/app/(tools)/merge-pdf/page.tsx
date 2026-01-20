'use client';

import { useState, useCallback } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { ProcessingResult, UploadedFile } from '@/types/file';
import { mergePdfs } from '@/lib/pdf/merge';
import { triggerDownload } from '@/lib/utils/download';

// Get tool configuration
const tool = getToolBySlug('merge-pdf')!;
const seo = getToolSEO('merge-pdf')!;

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Merge PDF Tool Page
 * Combines multiple PDF files into a single document with drag-and-drop reordering
 * 
 * Requirements: 4.4, 6.1-6.7
 */
export default function MergePdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderedFiles, setOrderedFiles] = useState<UploadedFile[]>([]);

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    updateFileStatus,
    updateFileProgress,
  } = useFileUpload({ maxFiles: tool.maxFiles });

  // Sync orderedFiles with files when files change
  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      setResult(null);
      addFiles(selectedFiles);
      // Add new files to ordered list
      setOrderedFiles(prev => {
        const existingIds = new Set(prev.map(f => f.id));
        const newFiles = selectedFiles.map((f, i) => ({
          id: `${Date.now()}-${i}`,
          name: f.name,
          size: f.size,
          type: f.type,
          data: f,
          status: 'pending' as const,
          progress: 0,
        }));
        return [...prev, ...newFiles.filter(f => !existingIds.has(f.id))];
      });
    },
    [addFiles]
  );

  // Update ordered files when files from hook change
  useState(() => {
    if (files.length > 0 && orderedFiles.length === 0) {
      setOrderedFiles(files);
    }
  });

  /**
   * Handle drag start
   */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedFiles];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setOrderedFiles(newOrder);
    setDraggedIndex(index);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  /**
   * Handle file removal
   */
  const handleRemoveFile = (fileId: string) => {
    removeFile(fileId);
    setOrderedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  /**
   * Handle clear all files
   */
  const handleClearFiles = () => {
    clearFiles();
    setOrderedFiles([]);
    setResult(null);
  };

  /**
   * Process PDFs and merge them (client-side)
   */
  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (orderedFiles.length < 2) {
      return { success: false, error: 'Please select at least 2 PDF files to merge' };
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Update all files to processing
      orderedFiles.forEach(file => {
        updateFileStatus(file.id, 'processing');
        updateFileProgress(file.id, 0);
      });

      // Read all PDF files in order
      const pdfBuffers: ArrayBuffer[] = [];
      
      for (let i = 0; i < orderedFiles.length; i++) {
        const file = orderedFiles[i];
        const fileData = file.data as File;
        
        updateFileProgress(file.id, 30);
        
        const buffer = await fileData.arrayBuffer();
        pdfBuffers.push(buffer);
        
        updateFileProgress(file.id, 60);
      }

      // Merge PDFs
      const mergedPdfBytes = await mergePdfs(pdfBuffers);
      
      // Update all files to completed
      orderedFiles.forEach(file => {
        updateFileProgress(file.id, 100);
        updateFileStatus(file.id, 'completed');
      });

      // Create blob for download
      const newBuffer = new ArrayBuffer(mergedPdfBytes.byteLength);
      new Uint8Array(newBuffer).set(mergedPdfBytes);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const outputFilename = 'merged.pdf';

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Merge failed';
      
      orderedFiles.forEach(file => {
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
  }, [orderedFiles, updateFileStatus, updateFileProgress]);

  /**
   * Handle download
   */
  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({
        blob: result.file,
        filename: result.filename,
      });
    }
  };

  // SEO content sections
  const contentSections = [
    {
      heading: 'About PDF Merging',
      content: `
        <p>Merging PDF files is essential for combining multiple documents into a single, organized file. 
        AdobeWork makes it easy to combine PDFs directly in your browser with drag-and-drop reordering.</p>
        <p>Our PDF merger processes files entirely on your device, ensuring your documents never leave 
        your computer. This provides maximum privacy and security while delivering fast processing speeds.</p>
        <p>Whether you need to combine reports, contracts, or any other PDF documents, AdobeWork handles 
        it all with ease and precision.</p>
      `,
    },
    {
      heading: 'When to Use PDF Merging',
      content: `
        <p>PDF merging is useful for many scenarios:</p>
        <ul>
          <li><strong>Combining reports</strong> - Merge multiple report sections into a single document.</li>
          <li><strong>Creating portfolios</strong> - Combine work samples into one professional PDF.</li>
          <li><strong>Organizing documents</strong> - Consolidate related documents for easier management.</li>
          <li><strong>Preparing submissions</strong> - Combine required documents for applications or submissions.</li>
          <li><strong>Archiving</strong> - Merge related documents for long-term storage.</li>
        </ul>
      `,
    },
    {
      heading: 'How to Merge PDFs',
      content: `
        <p>Merging PDFs with AdobeWork is simple:</p>
        <ol>
          <li><strong>Upload PDFs</strong> - Select multiple PDF files from your device.</li>
          <li><strong>Reorder</strong> - Drag and drop files to arrange them in your preferred order.</li>
          <li><strong>Merge</strong> - Click the Merge button to combine your PDFs.</li>
          <li><strong>Download</strong> - Download your merged PDF instantly.</li>
        </ol>
      `,
    },
    {
      heading: 'Privacy and Security',
      content: `
        <p>Your PDFs are processed entirely in your browser:</p>
        <ul>
          <li><strong>No upload to servers</strong> - Files never leave your device.</li>
          <li><strong>Client-side processing</strong> - All merging happens locally.</li>
          <li><strong>No data collection</strong> - We don't store or access your documents.</li>
        </ul>
      `,
    },
  ];

  const hasFiles = orderedFiles.length > 0;
  const canMerge = orderedFiles.length >= 2 && !isProcessing;

  return (
    <ToolPageLayout tool={tool} seo={seo} contentSections={contentSections}>
      <div className="space-y-6">
        {/* File Upload Area */}
        <FileDropzone
          acceptedFormats={tool.acceptedFormats}
          maxFileSize={tool.maxFileSize}
          maxFiles={tool.maxFiles}
          onFilesSelected={handleFilesSelected}
          disabled={isProcessing}
        />

        {/* File List with Drag-and-Drop Reordering */}
        {hasFiles && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Files to Merge ({orderedFiles.length})
              </h3>
              <p className="text-sm text-gray-500">
                Drag to reorder
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {orderedFiles.map((file, index) => (
                <div
                  key={file.id}
                  draggable={!isProcessing}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 flex items-center gap-4 cursor-move transition-colors ${
                    draggedIndex === index ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                  </div>

                  {/* Order Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* PDF Icon */}
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v4H8.5v-4zm2.5 0h1.5v4H11v-4zm2.5 0H15v4h-1.5v-4z"/>
                    </svg>
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {(file.status === 'processing' || file.status === 'completed') && (
                      <div className="mt-2">
                        <ProgressBar
                          progress={file.progress}
                          status={file.status === 'completed' ? 'completed' : 'processing'}
                          showPercentage={file.status === 'processing'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {canMerge && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProcess}
                  loading={isProcessing}
                  disabled={isProcessing}
                >
                  Merge {orderedFiles.length} PDFs
                </Button>
              )}

              {result?.success && result?.file && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleDownload}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Merged PDF
                </Button>
              )}

              {!isProcessing && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClearFiles}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Minimum files warning */}
            {orderedFiles.length === 1 && (
              <p className="text-sm text-amber-600">
                Please add at least one more PDF file to merge.
              </p>
            )}

            {/* Success Message */}
            {result?.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Merge Complete!</h4>
                    <p className="mt-1 text-sm text-green-700">
                      Your PDFs have been merged successfully. Click the download button above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {result && !result.success && result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Merge Error</h4>
                    <p className="mt-1 text-sm text-red-700">{result.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
