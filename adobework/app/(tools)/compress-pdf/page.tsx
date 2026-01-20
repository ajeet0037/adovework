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
import { compressPdfWithStats, getCompressionStats } from '@/lib/pdf/compress';
import { triggerDownload } from '@/lib/utils/download';

// Get tool configuration
const tool = getToolBySlug('compress-pdf')!;
const seo = getToolSEO('compress-pdf')!;

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  compressionRatio: number;
  percentReduction: number;
}

/**
 * Compress PDF Tool Page
 * Reduces PDF file size while maintaining quality (client-side processing)
 * 
 * Requirements: 4.5, 6.1-6.7
 */
export default function CompressPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);

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
      setCompressionStats(null);
      addFiles(selectedFiles);
    },
    [addFiles]
  );

  /**
   * Process PDF and compress it (client-side)
   */
  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0) {
      return { success: false, error: 'No file selected' };
    }

    const file = files[0];
    setIsProcessing(true);
    setResult(null);
    setCompressionStats(null);

    try {
      updateFileStatus(file.id, 'processing');
      updateFileProgress(file.id, 10);

      // Read the PDF file
      const fileData = file.data as File;
      const originalBuffer = await fileData.arrayBuffer();
      
      updateFileProgress(file.id, 30);

      // Compress the PDF
      const { compressed, stats } = await compressPdfWithStats(originalBuffer);
      
      updateFileProgress(file.id, 80);

      // Store compression stats
      setCompressionStats(stats);

      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      // Create blob for download
      const newBuffer = new ArrayBuffer(compressed.byteLength);
      new Uint8Array(newBuffer).set(compressed);
      const blob = new Blob([newBuffer], { type: 'application/pdf' });
      
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_compressed.pdf`;

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
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

  /**
   * Handle clear files
   */
  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
    setCompressionStats(null);
  }, [clearFiles]);

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
      heading: 'About PDF Compression',
      content: `
        <p>PDF compression reduces file size while maintaining document quality, making it easier to 
        share, email, and store your documents. AdobeWork compresses PDFs directly in your browser 
        for maximum privacy and speed.</p>
        <p>Our compression algorithm removes unnecessary metadata and optimizes the PDF structure 
        to achieve smaller file sizes without significantly affecting visual quality.</p>
        <p>Whether you need to email a large document or save storage space, AdobeWork's PDF 
        compressor helps you achieve optimal file sizes quickly and securely.</p>
      `,
    },
    {
      heading: 'When to Compress PDFs',
      content: `
        <p>PDF compression is useful in many scenarios:</p>
        <ul>
          <li><strong>Email attachments</strong> - Reduce file size to meet email attachment limits.</li>
          <li><strong>Web uploads</strong> - Smaller files upload faster to websites and forms.</li>
          <li><strong>Storage optimization</strong> - Save disk space when archiving documents.</li>
          <li><strong>Faster sharing</strong> - Compressed files transfer more quickly.</li>
          <li><strong>Mobile viewing</strong> - Smaller PDFs load faster on mobile devices.</li>
        </ul>
      `,
    },
    {
      heading: 'How PDF Compression Works',
      content: `
        <p>AdobeWork's compression process:</p>
        <ol>
          <li><strong>Upload</strong> - Select your PDF file from your device.</li>
          <li><strong>Analyze</strong> - The compressor analyzes the PDF structure.</li>
          <li><strong>Optimize</strong> - Metadata is removed and structure is optimized.</li>
          <li><strong>Download</strong> - Get your compressed PDF with size comparison.</li>
        </ol>
        <p>The compression ratio depends on the original PDF content. Documents with images 
        typically see greater size reductions than text-only documents.</p>
      `,
    },
    {
      heading: 'Privacy and Security',
      content: `
        <p>Your PDFs are processed entirely in your browser:</p>
        <ul>
          <li><strong>No upload to servers</strong> - Files never leave your device.</li>
          <li><strong>Client-side processing</strong> - All compression happens locally.</li>
          <li><strong>No data collection</strong> - We don't store or access your documents.</li>
          <li><strong>Instant results</strong> - No waiting for server processing.</li>
        </ul>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];
  const canCompress = hasFile && !isProcessing && file?.status !== 'completed';

  return (
    <ToolPageLayout tool={tool} seo={seo} contentSections={contentSections}>
      <div className="space-y-6">
        {/* File Upload Area */}
        {!hasFile && (
          <FileDropzone
            acceptedFormats={tool.acceptedFormats}
            maxFileSize={tool.maxFileSize}
            maxFiles={tool.maxFiles}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
          />
        )}

        {/* File Display and Processing */}
        {hasFile && file && (
          <div className="space-y-6">
            {/* File Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                {/* PDF Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v4H8.5v-4zm2.5 0h1.5v4H11v-4zm2.5 0H15v4h-1.5v-4z"/>
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Original size: {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
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

            {/* Compression Results */}
            {compressionStats && result?.success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  Compression Results
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Original Size</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatFileSize(compressionStats.originalSize)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Compressed Size</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatFileSize(compressionStats.compressedSize)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Space Saved</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatFileSize(compressionStats.savedBytes)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Reduction</p>
                    <p className="text-xl font-bold text-green-600">
                      {compressionStats.percentReduction.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Visual comparison bar */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">Size comparison:</span>
                  </div>
                  <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gray-400 rounded-full"
                      style={{ width: '100%' }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        Original
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div 
                      className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(5, (compressionStats.compressedSize / compressionStats.originalSize) * 100)}%` 
                      }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        Compressed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {canCompress && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProcess}
                  loading={isProcessing}
                  disabled={isProcessing}
                >
                  Compress PDF
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
                  Download Compressed PDF
                </Button>
              )}

              {!isProcessing && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClearFiles}
                >
                  {result?.success ? 'Compress Another' : 'Clear'}
                </Button>
              )}
            </div>

            {/* Error Message */}
            {result && !result.success && result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Compression Error</h4>
                    <p className="mt-1 text-sm text-red-700">{result.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Note about compression */}
            {!result && !isProcessing && (
              <p className="text-sm text-gray-500 text-center">
                💡 Compression results vary based on PDF content. Documents with images typically see greater size reductions.
              </p>
            )}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
