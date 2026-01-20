'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PDFDocument } from 'pdf-lib';

export default function ScanToPdfPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      console.error(err);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    // Apply basic image enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Increase contrast
    const factor = 1.2;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i+1] = Math.min(255, Math.max(0, factor * (data[i+1] - 128) + 128));
      data[i+2] = Math.min(255, Math.max(0, factor * (data[i+2] - 128) + 128));
    }
    ctx.putImageData(imageData, 0, 0);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImages(prev => [...prev, imageUrl]);
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const createPdf = async () => {
    if (capturedImages.length === 0) return;
    setIsProcessing(true);

    try {
      const pdf = await PDFDocument.create();
      
      for (const imageUrl of capturedImages) {
        const imageBytes = await fetch(imageUrl).then(r => r.arrayBuffer());
        const image = await pdf.embedJpg(imageBytes);
        
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      
      const pdfBytes = await pdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `scanned_document_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to create PDF');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Scan to PDF</h1>
          <p className="text-gray-600 mt-2">Use your camera to scan documents and create PDFs</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Camera view */}
          <div className="relative mb-6">
            {!isStreaming ? (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📷</span>
                  <Button onClick={startCamera}>Start Camera</Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg bg-black"
                  playsInline
                  muted
                />
                {/* Scan guide overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <Button onClick={captureImage} className="bg-white text-gray-900 hover:bg-gray-100">
                    📸 Capture
                  </Button>
                  <Button variant="outline" onClick={stopCamera} className="bg-white/80">
                    Stop Camera
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Captured images */}
          {capturedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Captured Pages ({capturedImages.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {capturedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt={`Page ${index + 1}`} className="w-full rounded-lg border border-gray-200" />
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={() => removeImage(index)}
                        className="bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                      Page {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={createPdf} loading={isProcessing} className="flex-1">
                  Create PDF ({capturedImages.length} pages)
                </Button>
                <Button variant="outline" onClick={() => setCapturedImages([])}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">📋 Instructions:</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Click &quot;Start Camera&quot; and allow camera access</li>
              <li>Position your document within the frame</li>
              <li>Click &quot;Capture&quot; to scan each page</li>
              <li>Review captured pages and remove any unwanted ones</li>
              <li>Click &quot;Create PDF&quot; to generate your document</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
