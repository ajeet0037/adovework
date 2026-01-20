'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { SignatureCanvas } from '@/components/tools/SignatureCanvas';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { ProcessingResult } from '@/types/file';
import { signPdf, SignaturePlacement, getPdfPageDimensions } from '@/lib/pdf/sign';
import { triggerDownload } from '@/lib/utils/download';

const tool = getToolBySlug('sign-pdf')!;
const seo = getToolSEO('sign-pdf')!;

export default function SignPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [signatureX, setSignatureX] = useState(100);
  const [signatureY, setSignatureY] = useState(100);
  const [signatureWidth, setSignatureWidth] = useState(200);
  const [signatureHeight, setSignatureHeight] = useState(80);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

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
      addFiles(selectedFiles);
      
      // Get page dimensions
      if (selectedFiles.length > 0) {
        try {
          const buffer = await selectedFiles[0].arrayBuffer();
          const dimensions = await getPdfPageDimensions(buffer);
          setTotalPages(dimensions.length);
          if (dimensions.length > 0) {
            setPageDimensions(dimensions[0]);
            // Set default signature position (bottom right area)
            setSignatureX(dimensions[0].width - 250);
            setSignatureY(100);
          }
        } catch (error) {
          console.error('Failed to get PDF dimensions:', error);
        }
      }
    },
    [addFiles]
  );

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignatureData(dataUrl);
  }, []);

  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0) {
      return { success: false, error: 'No file selected' };
    }

    if (!signatureData) {
      return { success: false, error: 'Please draw your signature first' };
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

      const placement: SignaturePlacement = {
        page: pageNumber,
        x: signatureX,
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight,
      };

      const signedPdfBytes = await signPdf(buffer, {
        signatureData,
        placements: [placement],
      });
      
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const newBuffer = new ArrayBuffer(signedPdfBytes.byteLength);
      new Uint8Array(newBuffer).set(signedPdfBytes);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_signed.pdf`;

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signing failed';
      updateFileStatus(file.id, 'error', errorMessage);
      const processingResult: ProcessingResult = { success: false, error: errorMessage };
      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, signatureData, pageNumber, signatureX, signatureY, signatureWidth, signatureHeight, updateFileStatus, updateFileProgress]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
    setSignatureData(null);
    setPageNumber(1);
    setTotalPages(1);
    setPageDimensions(null);
  }, [clearFiles]);

  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({ blob: result.file, filename: result.filename });
    }
  };

  const contentSections = [
    {
      heading: 'About PDF Signing',
      content: `
        <p>AdobeWork allows you to add electronic signatures to your PDF documents quickly and securely. 
        Draw your signature directly in your browser or upload an image of your signature.</p>
        <p>All processing happens locally in your browser, ensuring your documents remain private.</p>
      `,
    },
    {
      heading: 'How to Sign a PDF',
      content: `
        <ol>
          <li><strong>Upload</strong> - Select your PDF document.</li>
          <li><strong>Draw</strong> - Create your signature using the canvas.</li>
          <li><strong>Position</strong> - Set where the signature should appear.</li>
          <li><strong>Sign</strong> - Click Sign PDF to apply your signature.</li>
          <li><strong>Download</strong> - Download your signed document.</li>
        </ol>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];
  const canSign = hasFile && signatureData && !isProcessing && file?.status !== 'completed';

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
            {/* File Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{totalPages} page{totalPages > 1 ? 's' : ''}</p>
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

            {/* Signature Canvas */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Draw Your Signature</h3>
              <SignatureCanvas
                width={400}
                height={150}
                strokeColor="#000000"
                strokeWidth={2}
                onSignatureChange={handleSignatureChange}
                disabled={isProcessing}
              />
            </div>

            {/* Signature Placement Options */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Signature Placement</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="pageNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Page
                  </label>
                  <select
                    id="pageNumber"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    disabled={isProcessing}
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="signatureX" className="block text-sm font-medium text-gray-700 mb-1">
                    X Position
                  </label>
                  <input
                    type="number"
                    id="signatureX"
                    value={signatureX}
                    onChange={(e) => setSignatureX(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    min={0}
                    max={pageDimensions?.width || 612}
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label htmlFor="signatureY" className="block text-sm font-medium text-gray-700 mb-1">
                    Y Position
                  </label>
                  <input
                    type="number"
                    id="signatureY"
                    value={signatureY}
                    onChange={(e) => setSignatureY(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    min={0}
                    max={pageDimensions?.height || 792}
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label htmlFor="signatureWidth" className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    id="signatureWidth"
                    value={signatureWidth}
                    onChange={(e) => setSignatureWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    min={50}
                    max={400}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="signatureHeight" className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    id="signatureHeight"
                    value={signatureHeight}
                    onChange={(e) => setSignatureHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    min={20}
                    max={200}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {pageDimensions && (
                <p className="text-xs text-gray-500">
                  Page dimensions: {Math.round(pageDimensions.width)} × {Math.round(pageDimensions.height)} points
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {canSign && (
                <Button variant="primary" size="lg" onClick={handleProcess} loading={isProcessing}>
                  Sign PDF
                </Button>
              )}
              {result?.success && result?.file && (
                <Button variant="primary" size="lg" onClick={handleDownload}>
                  Download Signed PDF
                </Button>
              )}
              {!isProcessing && (
                <Button variant="outline" size="lg" onClick={handleClearFiles}>
                  {result?.success ? 'Sign Another' : 'Clear'}
                </Button>
              )}
            </div>

            {/* Error Message */}
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
