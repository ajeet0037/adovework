'use client';

import { useState, useCallback } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { ProcessingResult } from '@/types/file';
import { reorderPdf } from '@/lib/pdf/reorder';
import { getPdfPageCount } from '@/lib/pdf/split';
import { triggerDownload } from '@/lib/utils/download';

const tool = getToolBySlug('reorder-pdf')!;
const seo = getToolSEO('reorder-pdf')!;

export default function ReorderPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);

  const {
    files,
    addFiles,
    clearFiles,
    updateFileStatus,
    updateFileProgress,
  } = useFileUpload({ maxFiles: tool.maxFiles });

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setResult(null);
      setPageOrder([]);
      addFiles(selectedFiles);
      
      if (selectedFiles.length > 0) {
        try {
          const buffer = await selectedFiles[0].arrayBuffer();
          setPdfBuffer(buffer);
          const count = await getPdfPageCount(buffer);
          setPageOrder(Array.from({ length: count }, (_, i) => i + 1));
        } catch {
          setPageOrder([]);
        }
      }
    },
    [addFiles]
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...pageOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setPageOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0 || !pdfBuffer) {
      return { success: false, error: 'No file selected' };
    }

    const file = files[0];
    setIsProcessing(true);
    setResult(null);

    try {
      updateFileStatus(file.id, 'processing');
      updateFileProgress(file.id, 30);

      const reorderedPdfBytes = await reorderPdf(pdfBuffer, pageOrder);
      
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const newBuffer = new ArrayBuffer(reorderedPdfBytes.byteLength);
      new Uint8Array(newBuffer).set(reorderedPdfBytes);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_reordered.pdf`;

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reorder failed';
      updateFileStatus(file.id, 'error', errorMessage);
      const processingResult: ProcessingResult = { success: false, error: errorMessage };
      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, pdfBuffer, pageOrder, updateFileStatus, updateFileProgress]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
    setPageOrder([]);
    setPdfBuffer(null);
  }, [clearFiles]);

  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({ blob: result.file, filename: result.filename });
    }
  };

  const contentSections = [
    {
      heading: 'About PDF Reordering',
      content: `
        <p>PDF reordering allows you to rearrange pages in any order you want. 
        Simply drag and drop pages to reorganize your document.</p>
        <p>All processing happens in your browser for maximum privacy and speed.</p>
      `,
    },
    {
      heading: 'How to Reorder PDFs',
      content: `
        <ol>
          <li><strong>Upload</strong> - Select your PDF file.</li>
          <li><strong>Drag & Drop</strong> - Rearrange pages by dragging them.</li>
          <li><strong>Save</strong> - Click Save to apply the new order.</li>
          <li><strong>Download</strong> - Download your reordered PDF.</li>
        </ol>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];
  const canReorder = hasFile && !isProcessing && pageOrder.length > 0 && file?.status !== 'completed';

  return (
    <ToolPageLayout tool={tool} seo={seo} contentSections={contentSections}>
      <div className="space-y-6">
        {!hasFile && (
          <FileDropzone
            acceptedFormats={tool.acceptedFormats}
            maxFileSize={tool.maxFileSize}
            maxFiles={tool.maxFiles}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
          />
        )}

        {hasFile && file && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{pageOrder.length} pages</p>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              {(file.status === 'processing' || file.status === 'completed') && (
                <div className="mt-4">
                  <ProgressBar
                    progress={file.progress}
                    status={file.status === 'completed' ? 'completed' : 'processing'}
                    showPercentage={file.status === 'processing'}
                  />
                </div>
              )}
            </div>

            {pageOrder.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Page Order</label>
                  <span className="text-xs text-gray-500">Drag to reorder</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pageOrder.map((page, index) => (
                    <div
                      key={`${page}-${index}`}
                      draggable={!isProcessing}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 cursor-move transition-colors ${
                        draggedIndex === index
                          ? 'border-primary-500 bg-primary-100'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span className="font-medium text-gray-700">{page}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {canReorder && (
                <Button variant="primary" size="lg" onClick={handleProcess} loading={isProcessing}>
                  Save New Order
                </Button>
              )}
              {result?.success && result?.file && (
                <Button variant="primary" size="lg" onClick={handleDownload}>
                  Download Reordered PDF
                </Button>
              )}
              {!isProcessing && (
                <Button variant="outline" size="lg" onClick={handleClearFiles}>
                  {result?.success ? 'Reorder Another' : 'Clear'}
                </Button>
              )}
            </div>

            {result && !result.success && result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
