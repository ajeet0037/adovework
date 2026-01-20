'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cropPdfByPercentage } from '@/lib/pdf/crop';
import { triggerDownload } from '@/lib/utils/download';

export default function CropPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  const { files, addFiles, clearFiles, updateFileStatus, updateFileProgress } = useFileUpload({ maxFiles: 1 });

  const handleProcess = async () => {
    if (files.length === 0) return;
    const file = files[0];
    setIsProcessing(true);
    setResult(null);

    try {
      updateFileStatus(file.id, 'processing');
      updateFileProgress(file.id, 30);
      
      const buffer = file.data instanceof File ? await file.data.arrayBuffer() : file.data;
      updateFileProgress(file.id, 60);
      
      const resultBytes = await cropPdfByPercentage(buffer, margins);
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const blob = new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' });
      const filename = file.name.replace(/\.pdf$/i, '_cropped.pdf');
      setResult({ blob, filename });
    } catch (error) {
      updateFileStatus(file.id, 'error', error instanceof Error ? error.message : 'Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <span className="text-3xl">✂️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Crop PDF</h1>
          <p className="text-gray-600 mt-2">Trim margins from your PDF pages</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {files.length === 0 ? (
            <FileDropzone acceptedFormats={['.pdf']} maxFileSize={50 * 1024 * 1024} maxFiles={1} onFilesSelected={addFiles} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <span className="font-medium">{files[0].name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={clearFiles}>Remove</Button>
              </div>

              {/* Crop margins */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Crop Margins (%)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                    <div key={side}>
                      <label className="block text-sm text-gray-600 mb-1 capitalize">{side}</label>
                      <input
                        type="number"
                        value={margins[side]}
                        onChange={(e) => setMargins({ ...margins, [side]: Number(e.target.value) })}
                        min={0}
                        max={50}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">Enter percentage of page to crop from each side</p>
              </div>

              {files[0].status === 'processing' && <ProgressBar progress={files[0].progress} status="processing" />}

              <div className="flex gap-3">
                {!result ? (
                  <Button onClick={handleProcess} loading={isProcessing} className="flex-1">Crop PDF</Button>
                ) : (
                  <>
                    <Button onClick={() => triggerDownload(result)} className="flex-1">Download</Button>
                    <Button variant="outline" onClick={() => { clearFiles(); setResult(null); }}>Process Another</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
