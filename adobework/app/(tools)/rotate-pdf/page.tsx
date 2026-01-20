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
import { rotatePdf, RotationAngle } from '@/lib/pdf/rotate';
import { triggerDownload } from '@/lib/utils/download';

const tool = getToolBySlug('rotate-pdf')!;
const seo = getToolSEO('rotate-pdf')!;

export default function RotatePdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [rotationAngle, setRotationAngle] = useState<RotationAngle>(90);

  const {
    files,
    addFiles,
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
      updateFileProgress(file.id, 20);

      const fileData = file.data as File;
      const buffer = await fileData.arrayBuffer();
      
      updateFileProgress(file.id, 50);

      const rotatedPdfBytes = await rotatePdf(buffer, rotationAngle);
      
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const newBuffer = new ArrayBuffer(rotatedPdfBytes.byteLength);
      new Uint8Array(newBuffer).set(rotatedPdfBytes);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_rotated.pdf`;

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rotation failed';
      updateFileStatus(file.id, 'error', errorMessage);
      const processingResult: ProcessingResult = { success: false, error: errorMessage };
      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, rotationAngle, updateFileStatus, updateFileProgress]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
  }, [clearFiles]);

  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({ blob: result.file, filename: result.filename });
    }
  };

  const contentSections = [
    {
      heading: 'About PDF Rotation',
      content: `
        <p>PDF rotation allows you to fix pages that are upside down or sideways. 
        AdobeWork processes files directly in your browser for maximum privacy.</p>
        <p>Rotate all pages at once by 90°, 180°, or 270° with just a few clicks.</p>
      `,
    },
    {
      heading: 'How to Rotate PDFs',
      content: `
        <ol>
          <li><strong>Upload</strong> - Select your PDF file.</li>
          <li><strong>Choose Angle</strong> - Select 90°, 180°, or 270° rotation.</li>
          <li><strong>Rotate</strong> - Click Rotate to apply the rotation.</li>
          <li><strong>Download</strong> - Download your rotated PDF.</li>
        </ol>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];
  const canRotate = hasFile && !isProcessing && file?.status !== 'completed';

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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rotation Angle
              </label>
              <div className="flex gap-4">
                {([90, 180, 270] as RotationAngle[]).map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => setRotationAngle(angle)}
                    disabled={isProcessing}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      rotationAngle === angle
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">↻</div>
                    <div className="font-medium">{angle}°</div>
                    <div className="text-xs text-gray-500">
                      {angle === 90 ? 'Clockwise' : angle === 180 ? 'Flip' : 'Counter-clockwise'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {canRotate && (
                <Button variant="primary" size="lg" onClick={handleProcess} loading={isProcessing}>
                  Rotate PDF
                </Button>
              )}
              {result?.success && result?.file && (
                <Button variant="primary" size="lg" onClick={handleDownload}>
                  Download Rotated PDF
                </Button>
              )}
              {!isProcessing && (
                <Button variant="outline" size="lg" onClick={handleClearFiles}>
                  {result?.success ? 'Rotate Another' : 'Clear'}
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
