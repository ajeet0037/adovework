'use client';

import { useState, useRef, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { triggerDownload } from '@/lib/utils/download';

export default function ComparePdfPage() {
  const [pdf1Buffer, setPdf1Buffer] = useState<ArrayBuffer | null>(null);
  const [pdf2Buffer, setPdf2Buffer] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages1, setTotalPages1] = useState(0);
  const [totalPages2, setTotalPages2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const { files: files1, addFiles: addFiles1, clearFiles: clearFiles1 } = useFileUpload({ maxFiles: 1 });
  const { files: files2, addFiles: addFiles2, clearFiles: clearFiles2 } = useFileUpload({ maxFiles: 1 });

  // Load PDFs
  useEffect(() => {
    const loadPdf = async (file: any, setBuffer: (b: ArrayBuffer) => void, setPages: (n: number) => void) => {
      const buffer = file.data instanceof File ? await file.data.arrayBuffer() : file.data;
      setBuffer(buffer);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPages(pdf.numPages);
    };

    if (files1.length > 0) loadPdf(files1[0], setPdf1Buffer, setTotalPages1);
    if (files2.length > 0) loadPdf(files2[0], setPdf2Buffer, setTotalPages2);
  }, [files1, files2]);

  // Render pages
  useEffect(() => {
    if (!pdf1Buffer || !pdf2Buffer) return;
    
    const renderPages = async () => {
      setIsLoading(true);
      const pdfjsLib = await import('pdfjs-dist');
      
      const renderToCanvas = async (buffer: ArrayBuffer, canvas: HTMLCanvasElement, pageNum: number) => {
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (pageNum > pdf.numPages) return null;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };

      const img1 = await renderToCanvas(pdf1Buffer, canvas1Ref.current!, currentPage);
      const img2 = await renderToCanvas(pdf2Buffer, canvas2Ref.current!, currentPage);

      // Create overlay comparison
      if (viewMode === 'overlay' && img1 && img2 && overlayCanvasRef.current) {
        const overlay = overlayCanvasRef.current;
        overlay.width = Math.max(img1.width, img2.width);
        overlay.height = Math.max(img1.height, img2.height);
        const ctx = overlay.getContext('2d')!;
        
        // Draw differences
        const diffData = ctx.createImageData(overlay.width, overlay.height);
        for (let i = 0; i < Math.min(img1.data.length, img2.data.length); i += 4) {
          const diff = Math.abs(img1.data[i] - img2.data[i]) + 
                       Math.abs(img1.data[i+1] - img2.data[i+1]) + 
                       Math.abs(img1.data[i+2] - img2.data[i+2]);
          if (diff > 30) {
            diffData.data[i] = 255;     // Red for differences
            diffData.data[i+1] = 0;
            diffData.data[i+2] = 0;
            diffData.data[i+3] = 200;
          } else {
            diffData.data[i] = img1.data[i];
            diffData.data[i+1] = img1.data[i+1];
            diffData.data[i+2] = img1.data[i+2];
            diffData.data[i+3] = 255;
          }
        }
        ctx.putImageData(diffData, 0, 0);
      }
      
      setIsLoading(false);
    };

    renderPages();
  }, [pdf1Buffer, pdf2Buffer, currentPage, viewMode]);

  const maxPages = Math.max(totalPages1, totalPages2);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Compare PDF</h1>
          <p className="text-gray-600 mt-2">Compare two PDF documents side by side</p>
        </div>

        {/* File upload section */}
        {(!pdf1Buffer || !pdf2Buffer) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">📄 First PDF (Original)</h3>
              {files1.length === 0 ? (
                <FileDropzone acceptedFormats={['.pdf']} maxFileSize={20*1024*1024} maxFiles={1} onFilesSelected={addFiles1} />
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">{files1[0].name}</span>
                  <Button variant="outline" size="sm" onClick={clearFiles1}>Remove</Button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">📄 Second PDF (Modified)</h3>
              {files2.length === 0 ? (
                <FileDropzone acceptedFormats={['.pdf']} maxFileSize={20*1024*1024} maxFiles={1} onFilesSelected={addFiles2} />
              ) : (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">{files2[0].name}</span>
                  <Button variant="outline" size="sm" onClick={clearFiles2}>Remove</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison view */}
        {pdf1Buffer && pdf2Buffer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'side-by-side' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'overlay' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                >
                  Overlay (Differences in Red)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                  ← Prev
                </Button>
                <span className="text-sm text-gray-600">Page {currentPage} of {maxPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(maxPages, p+1))} disabled={currentPage === maxPages}>
                  Next →
                </Button>
              </div>
            </div>

            {/* Canvas display */}
            {isLoading && <div className="text-center py-8 text-gray-500">Loading...</div>}
            
            {viewMode === 'side-by-side' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-100 p-2">
                  <div className="text-xs text-gray-500 mb-2">Original</div>
                  <canvas ref={canvas1Ref} className="max-w-full" />
                </div>
                <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-100 p-2">
                  <div className="text-xs text-gray-500 mb-2">Modified</div>
                  <canvas ref={canvas2Ref} className="max-w-full" />
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-100 p-2">
                <div className="text-xs text-gray-500 mb-2">Differences highlighted in red</div>
                <canvas ref={overlayCanvasRef} className="max-w-full mx-auto" />
                <canvas ref={canvas1Ref} className="hidden" />
                <canvas ref={canvas2Ref} className="hidden" />
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button 
                variant="primary" 
                onClick={() => {
                  const canvas = viewMode === 'overlay' ? overlayCanvasRef.current : canvas1Ref.current;
                  if (canvas) {
                    canvas.toBlob((blob) => {
                      if (blob) {
                        triggerDownload({ 
                          blob, 
                          filename: `comparison_page_${currentPage}.png` 
                        });
                      }
                    }, 'image/png');
                  }
                }}
              >
                📥 Download Comparison
              </Button>
              <Button variant="outline" onClick={() => { clearFiles1(); clearFiles2(); setPdf1Buffer(null); setPdf2Buffer(null); }}>
                Compare Different Files
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
