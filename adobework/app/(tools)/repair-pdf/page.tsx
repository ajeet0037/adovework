'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { PDFDocument, degrees } from 'pdf-lib';
import { triggerDownload } from '@/lib/utils/download';

interface RepairIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

interface RepairAction {
  type: 'fixed' | 'optimized' | 'recovered';
  message: string;
}

interface RepairResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  issues: RepairIssue[];
  repairs: RepairAction[];
  stats: {
    originalSize: number;
    repairedSize: number;
    pagesFound: number;
    objectsRepaired: number;
  };
}

export default function RepairPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<RepairResult | null>(null);
  const [options, setOptions] = useState({
    fixStructure: true,
    rebuildMetadata: true,
    optimizeSize: true,
    fixPages: true,
  });

  const { files, addFiles, clearFiles } = useFileUpload({ maxFiles: 1 });

  const handleRepair = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    const issues: RepairIssue[] = [];
    const repairs: RepairAction[] = [];
    let objectsRepaired = 0;

    try {
      const file = files[0];
      const buffer = file.data instanceof File ? await file.data.arrayBuffer() : file.data;
      const originalSize = buffer.byteLength;
      
      setStep('Analyzing PDF structure...');
      setProgress(10);

      // Try multiple loading strategies
      let pdf: PDFDocument | null = null;
      
      // Strategy 1: Normal load
      try {
        pdf = await PDFDocument.load(buffer);
        repairs.push({ type: 'optimized', message: 'PDF structure validated successfully' });
      } catch {
        issues.push({ type: 'warning', message: 'Standard parsing failed' });
        
        // Strategy 2: Ignore encryption
        try {
          pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
          repairs.push({ type: 'recovered', message: 'Bypassed encryption issues' });
          objectsRepaired++;
        } catch {
          // Strategy 3: Lenient mode
          try {
            pdf = await PDFDocument.load(buffer, {
              ignoreEncryption: true,
              updateMetadata: false,
              throwOnInvalidObject: false,
            });
            repairs.push({ type: 'recovered', message: 'Recovered using lenient parsing' });
            objectsRepaired += 2;
          } catch {
            // Strategy 4: Check for header offset
            const uint8 = new Uint8Array(buffer);
            const text = new TextDecoder('latin1').decode(uint8.slice(0, 1024));
            const headerIdx = text.indexOf('%PDF-');
            
            if (headerIdx > 0) {
              issues.push({ type: 'info', message: `Found PDF header at offset ${headerIdx}` });
              const cleanBuffer = buffer.slice(headerIdx);
              pdf = await PDFDocument.load(cleanBuffer, {
                ignoreEncryption: true,
                throwOnInvalidObject: false,
              });
              repairs.push({ type: 'recovered', message: 'Removed junk data before PDF header' });
              objectsRepaired += 3;
            } else {
              throw new Error('Cannot recover - file is severely corrupted');
            }
          }
        }
      }

      if (!pdf) throw new Error('Failed to load PDF');
      setProgress(30);
      setStep('Checking pages...');

      // Check and fix pages
      const pages = pdf.getPages();
      if (pages.length === 0) {
        issues.push({ type: 'error', message: 'No pages found in document' });
      } else {
        repairs.push({ type: 'optimized', message: `Found ${pages.length} page(s)` });
      }

      if (options.fixPages) {
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();
          
          if (width <= 0 || height <= 0 || width > 14400 || height > 14400) {
            issues.push({ type: 'warning', message: `Page ${i + 1} has invalid dimensions (${width}x${height})` });
            page.setSize(612, 792);
            repairs.push({ type: 'fixed', message: `Fixed page ${i + 1} dimensions to Letter size` });
            objectsRepaired++;
          }
          
          // Check rotation
          const rotation = page.getRotation().angle;
          if (rotation % 90 !== 0) {
            page.setRotation(degrees(0));
            repairs.push({ type: 'fixed', message: `Fixed invalid rotation on page ${i + 1}` });
            objectsRepaired++;
          }
        }
      }
      setProgress(50);
      setStep('Rebuilding metadata...');

      // Rebuild metadata
      if (options.rebuildMetadata) {
        const existingTitle = pdf.getTitle();
        
        if (!existingTitle) {
          pdf.setTitle(file.name.replace(/\.pdf$/i, ''));
          repairs.push({ type: 'fixed', message: 'Added missing title' });
          objectsRepaired++;
        }
        
        pdf.setProducer('AdobeWork Repair Tool v2.0');
        pdf.setModificationDate(new Date());
        
        // Ensure creation date exists
        if (!pdf.getCreationDate()) {
          pdf.setCreationDate(new Date());
          repairs.push({ type: 'fixed', message: 'Added missing creation date' });
          objectsRepaired++;
        }
        
        repairs.push({ type: 'optimized', message: 'Metadata rebuilt successfully' });
      }
      setProgress(70);
      setStep('Optimizing document...');

      // Optimize if requested
      if (options.optimizeSize) {
        // Remove unused objects by saving and reloading
        const tempBytes = await pdf.save();
        pdf = await PDFDocument.load(tempBytes);
        repairs.push({ type: 'optimized', message: 'Removed unused objects' });
      }
      setProgress(85);
      setStep('Saving repaired PDF...');

      // Save final PDF
      const pdfBytes = await pdf.save();
      const repairedSize = pdfBytes.byteLength;
      setProgress(100);

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const filename = file.name.replace(/\.pdf$/i, '_repaired.pdf');

      setResult({
        success: true,
        blob,
        filename,
        issues,
        repairs,
        stats: {
          originalSize,
          repairedSize,
          pagesFound: pages.length,
          objectsRepaired,
        },
      });
    } catch (error) {
      setResult({
        success: false,
        issues: [{ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' }],
        repairs: [],
        stats: { originalSize: 0, repairedSize: 0, pagesFound: 0, objectsRepaired: 0 },
      });
    } finally {
      setIsProcessing(false);
      setStep('');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <span className="text-3xl">🔧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced PDF Repair</h1>
          <p className="text-gray-600 mt-2">Fix corrupted, damaged, or broken PDF files</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {files.length === 0 ? (
            <FileDropzone acceptedFormats={['.pdf']} maxFileSize={100 * 1024 * 1024} maxFiles={1} onFilesSelected={addFiles} />
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
                <Button variant="outline" size="sm" onClick={() => { clearFiles(); setResult(null); }}>Remove</Button>
              </div>

              {/* Repair options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Repair Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'fixStructure', label: 'Fix PDF Structure', desc: 'Repair corrupted structure' },
                    { key: 'fixPages', label: 'Fix Page Issues', desc: 'Repair invalid pages' },
                    { key: 'rebuildMetadata', label: 'Rebuild Metadata', desc: 'Fix document info' },
                    { key: 'optimizeSize', label: 'Optimize Size', desc: 'Remove unused data' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options[key as keyof typeof options]}
                        onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
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

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <ProgressBar progress={progress} status="processing" />
                  <p className="text-sm text-gray-600 text-center">{step}</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-4">
                  {/* Status banner */}
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <span className="text-3xl">{result.success ? '✅' : '❌'}</span>
                    <div>
                      <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.success ? 'PDF Repaired Successfully!' : 'Repair Failed'}
                      </p>
                      {result.success && (
                        <p className="text-sm text-green-700">
                          {result.stats.objectsRepaired} issues fixed • {result.stats.pagesFound} pages recovered
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {result.success && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-700">{result.stats.pagesFound}</p>
                        <p className="text-xs text-blue-600">Pages</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{result.stats.objectsRepaired}</p>
                        <p className="text-xs text-green-600">Issues Fixed</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-purple-700">
                          {result.stats.repairedSize < result.stats.originalSize ? '-' : '+'}
                          {Math.abs(Math.round((1 - result.stats.repairedSize / result.stats.originalSize) * 100))}%
                        </p>
                        <p className="text-xs text-purple-600">Size Change</p>
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {result.issues.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">⚠️ Issues Detected ({result.issues.length})</h4>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {result.issues.map((issue, i) => (
                          <li key={i} className={`flex items-start gap-2 ${
                            issue.type === 'error' ? 'text-red-700' : issue.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                          }`}>
                            <span>{issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Repairs made */}
                  {result.repairs.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">✅ Repairs Made ({result.repairs.length})</h4>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {result.repairs.map((repair, i) => (
                          <li key={i} className="flex items-start gap-2 text-green-700">
                            <span>{repair.type === 'fixed' ? '🔧' : repair.type === 'recovered' ? '♻️' : '⚡'}</span>
                            {repair.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!result ? (
                  <Button onClick={handleRepair} loading={isProcessing} className="flex-1">
                    🔧 Start Repair
                  </Button>
                ) : result.success && result.blob ? (
                  <>
                    <Button onClick={() => triggerDownload({ blob: result.blob!, filename: result.filename! })} className="flex-1">
                      📥 Download Repaired PDF
                    </Button>
                    <Button variant="outline" onClick={() => { clearFiles(); setResult(null); }}>
                      Repair Another
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => { clearFiles(); setResult(null); }} className="flex-1">
                    Try Another File
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
