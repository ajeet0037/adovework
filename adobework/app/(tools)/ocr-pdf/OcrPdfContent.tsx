'use client';

import { useState, useRef } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import Tesseract from 'tesseract.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { triggerDownload } from '@/lib/utils/download';

interface OcrPageResult {
  pageNum: number;
  text: string;
  confidence: number;
  wordCount: number;
}

interface OcrResult {
  text: string;
  confidence: number;
  pages: OcrPageResult[];
  searchablePdfBlob?: Blob;
}

const LANGUAGES = [
  { code: 'eng', name: 'English', flag: '🇺🇸' },
  { code: 'hin', name: 'Hindi', flag: '🇮' },
  { code: 'spa', name: 'Spanish', flag: '🇪' },
  { code: 'fra', name: 'French', flag: '🇫🇷' },
  { code: 'deu', name: 'German', flag: '🇩🇪' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'jpn', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ara', name: 'Arabic', flag: '🇸🇦' },
  { code: 'por', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'rus', name: 'Russian', flag: '🇷🇺' },
  { code: 'kor', name: 'Korean', flag: '🇰🇷' },
  { code: 'ita', name: 'Italian', flag: '🇮🇹' },
];

export default function OcrPdfContent() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [language, setLanguage] = useState('eng');
  const [outputFormat, setOutputFormat] = useState<'text' | 'searchable-pdf'>('searchable-pdf');
  const [accuracyMode, setAccuracyMode] = useState<'fast' | 'accurate'>('accurate');
  const [preprocessing, setPreprocessing] = useState({
    grayscale: true,
    contrast: true,
    denoise: false,
  });
  const [pageRange, setPageRange] = useState({ all: true, from: 1, to: 1 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preprocessCanvasRef = useRef<HTMLCanvasElement>(null);

  const { files, addFiles, clearFiles } = useFileUpload({ maxFiles: 1 });

  // Image preprocessing function
  const preprocessImage = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const canvas = preprocessCanvasRef.current!;
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d')!;
    
    // Draw original
    ctx.drawImage(sourceCanvas, 0, 0);
    
    if (!preprocessing.grayscale && !preprocessing.contrast && !preprocessing.denoise) {
      return canvas;
    }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Grayscale conversion
      if (preprocessing.grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }
      
      // Contrast enhancement
      if (preprocessing.contrast) {
        const factor = 1.5; // Contrast factor
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      }
      
      // Simple threshold for cleaner text (denoise)
      if (preprocessing.denoise) {
        const avg = (r + g + b) / 3;
        const threshold = avg > 180 ? 255 : (avg < 80 ? 0 : avg);
        r = g = b = threshold;
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const handleOcr = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const file = files[0];
      const arrayBuffer = file.data instanceof File ? await file.data.arrayBuffer() : file.data;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      setStep('Loading PDF...');
      setProgress(5);
      
      // Load PDF
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      
      const totalPages = pdf.numPages;
      const startPage = pageRange.all ? 1 : Math.max(1, pageRange.from);
      const endPage = pageRange.all ? totalPages : Math.min(totalPages, pageRange.to);
      const pagesToProcess = endPage - startPage + 1;
      
      setProgress(10);
      
      const pageResults: OcrPageResult[] = [];
      let allText = '';
      let totalConfidence = 0;
      
      // Create searchable PDF if needed
      let searchablePdf: PDFDocument | null = null;
      let font: Awaited<ReturnType<PDFDocument['embedFont']>> | null = null;
      
      if (outputFormat === 'searchable-pdf') {
        searchablePdf = await PDFDocument.create();
        font = await searchablePdf.embedFont(StandardFonts.Helvetica);
      }
      
      // Process each page
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const pageIndex = pageNum - startPage;
        setStep(`Processing page ${pageNum} of ${totalPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const scale = accuracyMode === 'accurate' ? 3 : 2;
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        // Apply preprocessing
        setStep(`Preprocessing page ${pageNum}...`);
        const processedCanvas = preprocessImage(canvas);
        
        const pageProgress = 10 + (pageIndex / pagesToProcess) * 70;
        setProgress(pageProgress);
        
        setStep(`Running OCR on page ${pageNum}...`);
        
        const ocrResult = await Tesseract.recognize(processedCanvas, language, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const ocrProgress = pageProgress + (m.progress * (70 / pagesToProcess));
              setProgress(Math.min(ocrProgress, 80));
            }
          },
        });
        
        const pageText = ocrResult.data.text.trim();
        const pageConfidence = ocrResult.data.confidence;
        const pageWords = pageText.split(/\s+/).filter(w => w.length > 0);
        
        pageResults.push({
          pageNum,
          text: pageText,
          confidence: pageConfidence,
          wordCount: pageWords.length,
        });
        
        if (pageText) {
          allText += `\n━━━ Page ${pageNum} ━━━\n\n${pageText}\n`;
          totalConfidence += pageConfidence;
        }
        
        // Add to searchable PDF
        if (searchablePdf && font && pageText) {
          setStep(`Creating searchable PDF page ${pageNum}...`);
          
          // Get original page dimensions
          const origViewport = page.getViewport({ scale: 1 });
          const pdfPage = searchablePdf.addPage([origViewport.width, origViewport.height]);
          
          // Draw original page image
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          const imageBytes = Uint8Array.from(atob(imageData.split(',')[1]), c => c.charCodeAt(0));
          const image = await searchablePdf.embedJpg(imageBytes);
          
          pdfPage.drawImage(image, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
          });
          
          // Add invisible text layer for searchability
          // Extract words from blocks -> paragraphs -> lines -> words
          const words: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> = [];
          
          if (ocrResult.data.blocks) {
            for (const block of ocrResult.data.blocks) {
              if (block.paragraphs) {
                for (const para of block.paragraphs) {
                  if (para.lines) {
                    for (const line of para.lines) {
                      if (line.words) {
                        for (const word of line.words) {
                          if (word.text?.trim()) {
                            words.push({ text: word.text, bbox: word.bbox });
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          const fontSize = 8;
          for (const word of words) {
            // Scale coordinates from OCR canvas to PDF page
            const x = word.bbox.x0 / scale;
            const y = origViewport.height - (word.bbox.y1 / scale);
            
            try {
              pdfPage.drawText(word.text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(1, 1, 1), // White (invisible)
                opacity: 0.01, // Nearly invisible but selectable
              });
            } catch {
              // Skip words that can't be rendered
            }
          }
        }
      }
      
      setStep('Finalizing...');
      setProgress(90);
      
      const avgConfidence = pagesToProcess > 0 ? totalConfidence / pagesToProcess : 0;
      
      let searchablePdfBlob: Blob | undefined;
      if (searchablePdf) {
        const pdfBytes = await searchablePdf.save();
        searchablePdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      }
      
      setResult({
        text: allText.trim() || 'No text detected in the document.',
        confidence: avgConfidence,
        pages: pageResults,
        searchablePdfBlob,
      });
      setProgress(100);
    } catch (error) {
      console.error('OCR failed:', error);
      setResult({
        text: `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        pages: [],
      });
    } finally {
      setIsProcessing(false);
      setStep('');
    }
  };

  const handleDownloadText = () => {
    if (!result) return;
    const blob = new Blob([result.text], { type: 'text/plain' });
    triggerDownload({ blob, filename: `${files[0]?.name.replace(/\.[^.]+$/, '')}_ocr.txt` });
  };

  const handleDownloadSearchablePdf = () => {
    if (!result?.searchablePdfBlob) return;
    triggerDownload({ 
      blob: result.searchablePdfBlob, 
      filename: `${files[0]?.name.replace(/\.[^.]+$/, '')}_searchable.pdf` 
    });
  };

  const handleCopyText = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalWords = result?.text.split(/\s+/).filter(w => w.length > 0).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <span className="text-3xl">👁️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced OCR PDF</h1>
          <p className="text-gray-600 mt-2">Extract text from scanned PDFs with AI-powered OCR</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {files.length === 0 ? (
            <FileDropzone
              acceptedFormats={['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']}
              maxFileSize={100 * 1024 * 1024}
              maxFiles={1}
              onFilesSelected={addFiles}
            />
          ) : (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-medium">{files[0].name}</p>
                    <p className="text-sm text-gray-500">{formatSize(files[0].size)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { clearFiles(); setResult(null); }}>
                  Remove
                </Button>
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Output Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOutputFormat('searchable-pdf')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      outputFormat === 'searchable-pdf'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">📑 Searchable PDF</p>
                    <p className="text-xs text-gray-500 mt-1">Original + hidden text layer</p>
                  </button>
                  <button
                    onClick={() => setOutputFormat('text')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      outputFormat === 'text'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">📝 Text Only</p>
                    <p className="text-xs text-gray-500 mt-1">Plain text extraction</p>
                  </button>
                </div>
              </div>

              {/* Language selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">OCR Language</label>
                <div className="grid grid-cols-4 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-2 rounded-lg border text-sm flex items-center gap-2 transition-all ${
                        language === lang.code
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accuracy Mode */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Accuracy Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAccuracyMode('fast')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      accuracyMode === 'fast'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">⚡ Fast</p>
                    <p className="text-xs text-gray-500 mt-1">Quick processing, good accuracy</p>
                  </button>
                  <button
                    onClick={() => setAccuracyMode('accurate')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      accuracyMode === 'accurate'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">🎯 Accurate</p>
                    <p className="text-xs text-gray-500 mt-1">Higher resolution, best results</p>
                  </button>
                </div>
              </div>

              {/* Preprocessing Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">🔧 Image Preprocessing</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'grayscale', label: 'Grayscale', desc: 'Convert to B&W' },
                    { key: 'contrast', label: 'Enhance Contrast', desc: 'Sharper text' },
                    { key: 'denoise', label: 'Denoise', desc: 'Remove noise' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preprocessing[key as keyof typeof preprocessing]}
                        onChange={(e) => setPreprocessing({ ...preprocessing, [key]: e.target.checked })}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Page Range */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">📄 Page Range</h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={pageRange.all}
                      onChange={() => setPageRange({ ...pageRange, all: true })}
                    />
                    <span className="text-sm">All pages</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!pageRange.all}
                      onChange={() => setPageRange({ ...pageRange, all: false })}
                    />
                    <span className="text-sm">Custom range</span>
                  </label>
                  {!pageRange.all && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={pageRange.from}
                        onChange={(e) => setPageRange({ ...pageRange, from: Number(e.target.value) })}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        min={1}
                        value={pageRange.to}
                        onChange={(e) => setPageRange({ ...pageRange, to: Number(e.target.value) })}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <ProgressBar progress={progress} status="processing" />
                  <p className="text-sm text-gray-600 text-center">{step}</p>
                </div>
              )}

              {/* Hidden canvases */}
              <canvas ref={canvasRef} className="hidden" />
              <canvas ref={preprocessCanvasRef} className="hidden" />

              {/* Results */}
              {result && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-purple-700">{result.pages.length}</p>
                      <p className="text-xs text-purple-600">Pages</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-green-700">{result.confidence.toFixed(0)}%</p>
                      <p className="text-xs text-green-600">Confidence</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-700">{totalWords}</p>
                      <p className="text-xs text-blue-600">Words</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-700">{result.text.length}</p>
                      <p className="text-xs text-amber-600">Characters</p>
                    </div>
                  </div>

                  {/* Per-page confidence */}
                  {result.pages.length > 1 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Page-wise Confidence</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.pages.map((p) => (
                          <div
                            key={p.pageNum}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              p.confidence >= 80 ? 'bg-green-100 text-green-700' :
                              p.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            Page {p.pageNum}: {p.confidence.toFixed(0)}%
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download buttons */}
                  <div className="flex gap-3">
                    {result.searchablePdfBlob && (
                      <Button onClick={handleDownloadSearchablePdf} className="flex-1">
                        📑 Download Searchable PDF
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleDownloadText}>
                      📝 Download TXT
                    </Button>
                    <Button variant="outline" onClick={handleCopyText}>
                      📋 Copy
                    </Button>
                  </div>

                  {/* Extracted text preview */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Extracted Text Preview</h3>
                    <textarea
                      value={result.text}
                      readOnly
                      className="w-full h-48 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm bg-gray-50 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Action button */}
              {!result && (
                <Button onClick={handleOcr} loading={isProcessing} className="w-full">
                  👁️ Start OCR Processing
                </Button>
              )}

              {result && (
                <Button variant="outline" onClick={() => { clearFiles(); setResult(null); }} className="w-full">
                  Process Another Document
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info boxes */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h4 className="font-medium text-purple-800 mb-2">📑 Searchable PDF</h4>
            <p className="text-sm text-purple-700">
              Creates a PDF with invisible text layer. You can search, select, and copy text while keeping original look.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">🔧 Preprocessing</h4>
            <p className="text-sm text-blue-700">
              Grayscale and contrast enhancement improve OCR accuracy for low-quality scans.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-medium text-green-800 mb-2">🎯 Best Results</h4>
            <p className="text-sm text-green-700">
              Use 300+ DPI scans, select correct language, and enable preprocessing for best accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
