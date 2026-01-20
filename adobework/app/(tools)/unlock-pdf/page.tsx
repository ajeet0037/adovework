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
import { unlockPdf, requiresPassword } from '@/lib/pdf/unlock';
import { triggerDownload } from '@/lib/utils/download';

const tool = getToolBySlug('unlock-pdf')!;
const seo = getToolSEO('unlock-pdf')!;

export default function UnlockPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState<boolean | null>(null);

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
      setPassword('');
      setNeedsPassword(null);
      addFiles(selectedFiles);
      
      if (selectedFiles.length > 0) {
        try {
          const buffer = await selectedFiles[0].arrayBuffer();
          const needsPwd = await requiresPassword(buffer);
          setNeedsPassword(needsPwd);
        } catch {
          setNeedsPassword(true);
        }
      }
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

      const unlockResult = await unlockPdf(buffer, password);
      
      if (!unlockResult.success || !unlockResult.pdf) {
        throw new Error(unlockResult.error || 'Failed to unlock PDF');
      }

      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const newBuffer = new ArrayBuffer(unlockResult.pdf.byteLength);
      new Uint8Array(newBuffer).set(unlockResult.pdf);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_unlocked.pdf`;

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unlock failed';
      updateFileStatus(file.id, 'error', errorMessage);
      const processingResult: ProcessingResult = { success: false, error: errorMessage };
      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, password, updateFileStatus, updateFileProgress]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
    setPassword('');
    setNeedsPassword(null);
  }, [clearFiles]);

  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({ blob: result.file, filename: result.filename });
    }
  };

  const contentSections = [
    {
      heading: 'About PDF Unlocking',
      content: `
        <p>PDF unlocking removes password protection from your documents when you have the correct password. 
        AdobeWork processes files directly in your browser for maximum security.</p>
        <p>Your password is never sent to any server - all decryption happens locally.</p>
      `,
    },
    {
      heading: 'How to Unlock PDFs',
      content: `
        <ol>
          <li><strong>Upload</strong> - Select your protected PDF file.</li>
          <li><strong>Enter Password</strong> - Provide the correct password.</li>
          <li><strong>Unlock</strong> - Click Unlock to remove protection.</li>
          <li><strong>Download</strong> - Download your unlocked PDF.</li>
        </ol>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];
  const canUnlock = hasFile && !isProcessing && file?.status !== 'completed';

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
                  {needsPassword !== null && (
                    <p className="text-sm text-gray-500">
                      {needsPassword ? '🔒 Password protected' : '🔓 Not protected'}
                    </p>
                  )}
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

            {needsPassword && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  PDF Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 pr-10"
                    placeholder="Enter the PDF password"
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {needsPassword === false && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  This PDF is not password protected. No unlocking needed.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {canUnlock && needsPassword && (
                <Button variant="primary" size="lg" onClick={handleProcess} loading={isProcessing}>
                  Unlock PDF
                </Button>
              )}
              {result?.success && result?.file && (
                <Button variant="primary" size="lg" onClick={handleDownload}>
                  Download Unlocked PDF
                </Button>
              )}
              {!isProcessing && (
                <Button variant="outline" size="lg" onClick={handleClearFiles}>
                  {result?.success ? 'Unlock Another' : 'Clear'}
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
