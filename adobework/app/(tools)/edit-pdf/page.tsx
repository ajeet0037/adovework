'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { AdvancedPdfEditor } from '@/components/tools/AdvancedPdfEditor';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { ProcessingResult } from '@/types/file';
import { editPdf, Annotation } from '@/lib/pdf/edit';
import { getPdfPageDimensions } from '@/lib/pdf/sign';
import { triggerDownload } from '@/lib/utils/download';

const tool = getToolBySlug('edit-pdf')!;
const seo = getToolSEO('edit-pdf')!;

export default function EditPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [editedPdfBlob, setEditedPdfBlob] = useState<Blob | null>(null);
  const [editedFilename, setEditedFilename] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageDimensions, setPageDimensions] = useState<Array<{ width: number; height: number }>>([]);
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
      setAnnotations([]);
      setCurrentPage(1);
      addFiles(selectedFiles);
      
      if (selectedFiles.length > 0) {
        try {
          const buffer = await selectedFiles[0].arrayBuffer();
          setPdfBuffer(buffer);
          const dimensions = await getPdfPageDimensions(buffer);
          setTotalPages(dimensions.length);
          setPageDimensions(dimensions);
        } catch (error) {
          console.error('Failed to get PDF dimensions:', error);
        }
      }
    },
    [addFiles]
  );

  // Use ref to track annotations to avoid infinite loop
  const annotationsRef = useRef<Annotation[]>([]);
  
  const handleAnnotationsChange = useCallback((newAnnotations: Annotation[]) => {
    // Only update if annotations actually changed
    if (JSON.stringify(annotationsRef.current) !== JSON.stringify(newAnnotations)) {
      console.log('Annotations received:', newAnnotations.length);
      annotationsRef.current = newAnnotations;
      setAnnotations([...newAnnotations]);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleProcess = useCallback(async (): Promise<ProcessingResult> => {
    if (files.length === 0 || !pdfBuffer) {
      return { success: false, error: 'No file selected' };
    }

    if (annotations.length === 0) {
      return { success: false, error: 'No edits to apply. Add some annotations first.' };
    }

    const file = files[0];
    setIsProcessing(true);
    setResult(null);

    try {
      updateFileStatus(file.id, 'processing');
      updateFileProgress(file.id, 20);

      // Create fresh buffer from file to avoid detached buffer issue
      const fileData = files[0].data;
      const freshBuffer = fileData instanceof File ? await fileData.arrayBuffer() : fileData;
      
      updateFileProgress(file.id, 50);

      const editedPdfBytes = await editPdf(freshBuffer, {
        annotations,
      });
      
      if (!editedPdfBytes || editedPdfBytes.length === 0) {
        throw new Error('PDF editing returned empty result');
      }
      
      updateFileProgress(file.id, 80);

      // Create blob properly
      const pdfData = new Uint8Array(editedPdfBytes);
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      
      if (blob.size === 0) {
        throw new Error('Created blob is empty');
      }
      
      const originalName = file.name.replace(/\.pdf$/i, '');
      const outputFilename = `${originalName}_edited.pdf`;
      
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');
      
      // Store blob separately to prevent garbage collection
      setEditedPdfBlob(blob);
      setEditedFilename(outputFilename);

      const processingResult: ProcessingResult = {
        success: true,
        file: blob,
        filename: outputFilename,
      };

      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Editing failed';
      updateFileStatus(file.id, 'error', errorMessage);
      const processingResult: ProcessingResult = { success: false, error: errorMessage };
      setResult(processingResult);
      return processingResult;
    } finally {
      setIsProcessing(false);
    }
  }, [files, pdfBuffer, annotations, updateFileStatus, updateFileProgress]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setResult(null);
    setEditedPdfBlob(null);
    setEditedFilename('');
    setAnnotations([]);
    setCurrentPage(1);
    setTotalPages(1);
    setPageDimensions([]);
    setPdfBuffer(null);
  }, [clearFiles]);

  const handleDownload = useCallback(() => {
    if (editedPdfBlob && editedFilename) {
      // Verify blob is valid before download
      if (editedPdfBlob.size > 0) {
        triggerDownload({ blob: editedPdfBlob, filename: editedFilename });
      } else {
        alert('Error: PDF file is empty. Please try editing again.');
      }
    }
  }, [editedPdfBlob, editedFilename]);

  const contentSections = [
    {
      heading: 'About PDF Editing',
      content: `
        <p>AdobeWork's advanced PDF editor allows you to add text, highlight areas, and draw on your PDF documents 
        with a professional editing experience similar to Adobe Acrobat.</p>
        <p>Features include multiple fonts, various colors, zoom controls, and real-time PDF preview.</p>
      `,
    },
    {
      heading: 'How to Edit a PDF',
      content: `
        <ol>
          <li><strong>Upload</strong> - Select your PDF document.</li>
          <li><strong>Select Tool</strong> - Choose text, highlight, or draw tool from the toolbar.</li>
          <li><strong>Customize</strong> - Select font, size, and color for your annotations.</li>
          <li><strong>Edit</strong> - Click or draw on the PDF to add annotations.</li>
          <li><strong>Navigate</strong> - Use page controls to edit different pages.</li>
          <li><strong>Save</strong> - Click Save Edits to apply changes.</li>
          <li><strong>Download</strong> - Download your edited PDF.</li>
        </ol>
      `,
    },
  ];

  const hasFile = files.length > 0;
  const file = files[0];
  const canSave = hasFile && annotations.length > 0 && !isProcessing && file?.status !== 'completed';
  const currentPageDimensions = pageDimensions[currentPage - 1] || { width: 612, height: 792 };

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
          <div className="space-y-4">
            {/* File Info Bar */}
            <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                </svg>
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {totalPages} page{totalPages > 1 ? 's' : ''} • {annotations.length} edit{annotations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Original (without edits) */}
                {pdfBuffer && !result?.success && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
                      triggerDownload({ blob, filename: file.name });
                    }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Original
                  </Button>
                )}
                {canSave && (
                  <Button variant="primary" size="sm" onClick={handleProcess} loading={isProcessing}>
                    Save Edits
                  </Button>
                )}
                {result?.success && editedPdfBlob && (
                  <Button variant="primary" size="sm" onClick={handleDownload}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Edited PDF
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleClearFiles} disabled={isProcessing}>
                  {result?.success ? 'Edit Another' : 'Clear'}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {(file.status === 'processing' || file.status === 'completed') && (
              <ProgressBar
                progress={file.progress}
                status={file.status === 'completed' ? 'completed' : 'processing'}
                showPercentage={file.status === 'processing'}
              />
            )}

            {/* Advanced PDF Editor */}
            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '700px' }}>
              <AdvancedPdfEditor
                pdfBuffer={pdfBuffer}
                currentPage={currentPage}
                totalPages={totalPages}
                pageDimensions={currentPageDimensions}
                onAnnotationsChange={handleAnnotationsChange}
                disabled={isProcessing}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Error Message */}
            {result && !result.success && result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}

            {/* Success Download Section */}
            {result?.success && editedPdfBlob && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">PDF Edited Successfully!</h3>
                <p className="text-green-600 mb-4">Your edited PDF is ready to download.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="primary" size="lg" onClick={handleDownload}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Edited PDF
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleClearFiles}>
                    Edit Another PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
