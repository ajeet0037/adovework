'use client';

import { useState, useRef, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { redactPdf, RedactArea } from '@/lib/pdf/redact';
import { triggerDownload } from '@/lib/utils/download';

export default function RedactPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [redactAreas, setRedactAreas] = useState<RedactArea[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const { files, addFiles, clearFiles } = useFileUpload({ maxFiles: 1 });

  // Load PDF
  useEffect(() => {
    if (files.length === 0) return;
    const loadPdf = async () => {
      const file = files[0];
      const buffer = file.data instanceof File ? await file.data.arrayBuffer() : file.data;
      setPdfBuffer(buffer);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
      renderPage(pdf, 1);
    };
    loadPdf();
  }, [files]);

  const renderPage = async (pdf: any, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    drawRedactAreas();
  };

  const drawRedactAreas = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    redactAreas.filter(a => a.page === currentPage).forEach(area => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(area.x * 1.5, area.y * 1.5, area.width * 1.5, area.height * 1.5);
    });
  };

  useEffect(() => { drawRedactAreas(); }, [redactAreas, currentPage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    setDrawStart({ x: (e.clientX - rect.left) / 1.5, y: (e.clientY - rect.top) / 1.5 });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const endX = (e.clientX - rect.left) / 1.5;
    const endY = (e.clientY - rect.top) / 1.5;
    const width = Math.abs(endX - drawStart.x);
    const height = Math.abs(endY - drawStart.y);
    
    if (width > 5 && height > 5) {
      const canvas = canvasRef.current!;
      const pageHeight = canvas.height / 1.5;
      
      setRedactAreas(prev => [...prev, {
        page: currentPage,
        x: Math.min(drawStart.x, endX),
        y: pageHeight - Math.max(drawStart.y, endY),
        width,
        height,
      }]);
    }
    setIsDrawing(false);
    setDrawStart(null);
  };

  const handleProcess = async () => {
    if (!pdfBuffer || redactAreas.length === 0) return;
    setIsProcessing(true);
    try {
      const resultBytes = await redactPdf(pdfBuffer, { areas: redactAreas });
      const blob = new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' });
      setResult({ blob, filename: files[0].name.replace(/\.pdf$/i, '_redacted.pdf') });
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Redact PDF</h1>
          <p className="text-gray-600 mt-2">Black out sensitive information in your PDF</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {files.length === 0 ? (
            <FileDropzone acceptedFormats={['.pdf']} maxFileSize={50 * 1024 * 1024} maxFiles={1} onFilesSelected={addFiles} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{files[0].name}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRedactAreas([])}>Clear All</Button>
                  <Button variant="outline" size="sm" onClick={() => { clearFiles(); setRedactAreas([]); setResult(null); }}>
                    New File
                  </Button>
                </div>
              </div>

              <div className="bg-gray-100 p-2 rounded-lg text-center text-sm text-gray-600">
                Draw rectangles over areas you want to redact
              </div>

              <div className="relative inline-block border border-gray-300 rounded-lg overflow-hidden">
                <canvas ref={canvasRef} />
                <canvas
                  ref={overlayRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  width={canvasRef.current?.width}
                  height={canvasRef.current?.height}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{redactAreas.length} areas selected</span>
                <div className="flex gap-2">
                  {!result ? (
                    <Button onClick={handleProcess} loading={isProcessing} disabled={redactAreas.length === 0}>
                      Apply Redaction
                    </Button>
                  ) : (
                    <Button onClick={() => triggerDownload(result)}>Download Redacted PDF</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
