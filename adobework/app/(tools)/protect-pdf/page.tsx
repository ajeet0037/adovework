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
import { protectPdf, validatePasswordStrength } from '@/lib/pdf/protect';
import { triggerDownload } from '@/lib/utils/download';

const tool = getToolBySlug('protect-pdf')!;
const seo = getToolSEO('protect-pdf')!;

export default function ProtectPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      setPassword('');
      setConfirmPassword('');
      addFiles(selectedFiles);
    },
    [addFiles]
  );

  const passwordStrength = validatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const canProtect = files.length > 0 && password.length > 0 && passwordsMatch && !isProcessing;

  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0) {
      return { success: false, error: 'No file selected' };
    }

    if (!password) {
      return { success: false, error: 'Please enter a password' };
    }

    if (!passwordsMatch) {
      return { success: false, error: 'Passwords do not match' };
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

      const protectedPdfBytes = await protectPdf(buffer, {
        userPassword: password,
        ownerPassword: password,
      });
      
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const newBuffer = new ArrayBuffer(protectedPdfBytes.byteLength);
      new Uint8Array(newBuffer).set(protectedPdfBytes);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_protected.pdf`;

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Protection failed';
      updateFileStatus(file.id, 'error', errorMessage);
      const processingResult: ProcessingResult = { success: false, error: errorMessage };
      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, password, passwordsMatch, updateFileStatus, updateFileProgress]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
    setPassword('');
    setConfirmPassword('');
  }, [clearFiles]);

  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({ blob: result.file, filename: result.filename });
    }
  };

  const contentSections = [
    {
      heading: 'About PDF Protection',
      content: `
        <p>PDF protection adds password encryption to your documents, preventing unauthorized access. 
        AdobeWork processes files directly in your browser for maximum security.</p>
        <p>Your password is never sent to any server - all encryption happens locally.</p>
      `,
    },
    {
      heading: 'How to Protect PDFs',
      content: `
        <ol>
          <li><strong>Upload</strong> - Select your PDF file.</li>
          <li><strong>Set Password</strong> - Enter and confirm your password.</li>
          <li><strong>Protect</strong> - Click Protect to encrypt the PDF.</li>
          <li><strong>Download</strong> - Download your protected PDF.</li>
        </ol>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];

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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 pr-10"
                    placeholder="Enter password"
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
                {password && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`h-1 flex-1 rounded ${
                      passwordStrength.strength === 'weak' ? 'bg-red-400' :
                      passwordStrength.strength === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-xs text-gray-500 capitalize">{passwordStrength.strength}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                  disabled={isProcessing}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {canProtect && file?.status !== 'completed' && (
                <Button variant="primary" size="lg" onClick={handleProcess} loading={isProcessing}>
                  Protect PDF
                </Button>
              )}
              {result?.success && result?.file && (
                <Button variant="primary" size="lg" onClick={handleDownload}>
                  Download Protected PDF
                </Button>
              )}
              {!isProcessing && (
                <Button variant="outline" size="lg" onClick={handleClearFiles}>
                  {result?.success ? 'Protect Another' : 'Clear'}
                </Button>
              )}
            </div>

            {result?.success && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4" role="alert">
                <p className="text-sm text-amber-700">
                  ⚠️ Remember your password! It cannot be recovered if lost.
                </p>
              </div>
            )}

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
