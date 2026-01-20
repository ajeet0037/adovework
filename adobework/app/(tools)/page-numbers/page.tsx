'use client';

import { useState, useCallback } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { addPageNumbers, PageNumberOptions } from '@/lib/pdf/pageNumbers';
import { triggerDownload } from '@/lib/utils/download';

export default function PageNumbersPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'number',
    fontSize: 12,
    startPage: 1,
    margin: 30,
  });

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
      
      const resultBytes = await addPageNumbers(buffer, options);
      updateFileProgress(file.id, 100);
      updateFileStatus(file.id, 'completed');

      const blob = new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' });
      const filename = file.name.replace(/\.pdf$/i, '_numbered.pdf');
      setResult({ blob, filename });
    } catch (error) {
      updateFileStatus(file.id, 'error', error instanceof Error ? error.message : 'Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) triggerDownload(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🔢</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add Page Numbers</h1>
          <p className="text-gray-600 mt-2">Add page numbers to your PDF documents</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {files.length === 0 ? (
            <FileDropzone
              acceptedFormats={['.pdf']}
              maxFileSize={50 * 1024 * 1024}
              maxFiles={1}
              onFilesSelected={addFiles}
            />
          ) : (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <span className="font-medium">{files[0].name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={clearFiles}>Remove</Button>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={options.position}
                    onChange={(e) => setOptions({ ...options, position: e.target.value as PageNumberOptions['position'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={options.format}
                    onChange={(e) => setOptions({ ...options, format: e.target.value as PageNumberOptions['format'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="number">1, 2, 3...</option>
                    <option value="page-x">Page 1, Page 2...</option>
                    <option value="page-x-of-y">Page 1 of 10...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <input
                    type="number"
                    value={options.fontSize}
                    onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                    min={8}
                    max={24}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start From</label>
                  <input
                    type="number"
                    value={options.startPage}
                    onChange={(e) => setOptions({ ...options, startPage: Number(e.target.value) })}
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Progress */}
              {files[0].status === 'processing' && (
                <ProgressBar progress={files[0].progress} status="processing" />
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!result ? (
                  <Button onClick={handleProcess} loading={isProcessing} className="flex-1">
                    Add Page Numbers
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleDownload} className="flex-1">Download PDF</Button>
                    <Button variant="outline" onClick={() => { clearFiles(); setResult(null); }}>
                      Process Another
                    </Button>
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
