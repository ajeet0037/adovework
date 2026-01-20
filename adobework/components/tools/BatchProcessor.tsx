'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  BatchJob,
  BatchOperation,
  BatchSettings,
  BatchProgress,
  processBatch,
  getBatchOutputFilename,
  calculateBatchStats,
  isBatchComplete,
  getSuccessfulJobs,
} from '@/lib/image/batch';
import { formatFileSize } from '@/lib/image/compress';
import { createZipFromBlobs, generateZipFilename, downloadZip, ZipFile } from '@/lib/utils/zip';
import { triggerDownload } from '@/lib/utils/download';

interface BatchProcessorProps {
  files: File[];
  operation: BatchOperation;
  settings: BatchSettings;
  onClear: () => void;
  actionLabel: string;
  actionIcon: string;
}

export function BatchProcessor({
  files,
  operation,
  settings,
  onClear,
  actionLabel,
  actionIcon,
}: BatchProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const handleProcess = useCallback(async () => {
    setIsProcessing(true);
    setJobs([]);
    setProgress(null);

    try {
      const result = await processBatch(files, { operation, settings }, (prog) => {
        setProgress(prog);
        setJobs([...prog.jobs]);
      });
      setJobs(result);
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, operation, settings]);

  const handleDownloadAll = useCallback(async () => {
    const successfulJobs = getSuccessfulJobs(jobs);
    if (successfulJobs.length === 0) return;

    if (successfulJobs.length === 1) {
      // Single file - download directly
      const job = successfulJobs[0];
      if (job.result) {
        const filename = getBatchOutputFilename(job.file.name, operation, settings);
        triggerDownload({ blob: job.result, filename });
      }
      return;
    }

    // Multiple files - create ZIP
    setIsCreatingZip(true);
    setZipProgress(0);

    try {
      const zipFiles: ZipFile[] = successfulJobs.map((job) => ({
        name: getBatchOutputFilename(job.file.name, operation, settings),
        blob: job.result!,
      }));

      const zipBlob = await createZipFromBlobs(zipFiles, setZipProgress);
      const zipFilename = generateZipFilename(`${operation}_images`);
      downloadZip(zipBlob, zipFilename);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
    } finally {
      setIsCreatingZip(false);
      setZipProgress(0);
    }
  }, [jobs, operation, settings]);

  const handleDownloadSingle = useCallback(
    (job: BatchJob) => {
      if (job.result) {
        const filename = getBatchOutputFilename(job.file.name, operation, settings);
        triggerDownload({ blob: job.result, filename });
      }
    },
    [operation, settings]
  );

  const stats = jobs.length > 0 ? calculateBatchStats(jobs) : null;
  const isComplete = jobs.length > 0 && isBatchComplete(jobs);
  const successfulJobs = getSuccessfulJobs(jobs);

  return (
    <div className="space-y-6">
      {/* File List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </h3>
          {!isProcessing && jobs.length === 0 && (
            <button
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {files.map((file, index) => {
            const job = jobs.find((j) => j.file === file);
            return (
              <div
                key={`${file.name}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  job?.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : job?.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : job?.status === 'processing'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg">
                    {job?.status === 'completed'
                      ? '✅'
                      : job?.status === 'error'
                      ? '❌'
                      : job?.status === 'processing'
                      ? '⏳'
                      : '📄'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                      {job?.status === 'completed' && job.result && (
                        <span className="text-green-600">
                          {' → '}{formatFileSize(job.result.size)}
                        </span>
                      )}
                      {job?.status === 'error' && (
                        <span className="text-red-600"> - {job.error}</span>
                      )}
                    </p>
                  </div>
                </div>

                {job?.status === 'processing' && (
                  <div className="w-20">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {job?.status === 'completed' && job.result && (
                  <button
                    onClick={() => handleDownloadSingle(job)}
                    className="text-sm text-blue-600 hover:text-blue-800 px-2"
                  >
                    📥
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Progress */}
      {isProcessing && progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Processing {progress.currentFile || '...'}
            </span>
            <span className="text-gray-900 font-medium">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <ProgressBar
            progress={Math.round((progress.completed / progress.total) * 100)}
            status="processing"
          />
        </div>
      )}

      {/* ZIP Progress */}
      {isCreatingZip && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Creating ZIP file...</span>
            <span className="text-gray-900 font-medium">{zipProgress}%</span>
          </div>
          <ProgressBar progress={zipProgress} status="processing" />
        </div>
      )}

      {/* Results Summary */}
      {isComplete && stats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="font-medium text-green-800">
                Batch processing complete!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-xs text-green-600">Processed</p>
                  <p className="font-medium text-green-800">
                    {stats.completed} / {stats.total}
                  </p>
                </div>
                {stats.failed > 0 && (
                  <div>
                    <p className="text-xs text-red-600">Failed</p>
                    <p className="font-medium text-red-800">{stats.failed}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-green-600">Original Size</p>
                  <p className="font-medium text-green-800">
                    {formatFileSize(stats.totalOriginalSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">Result Size</p>
                  <p className="font-medium text-green-800">
                    {formatFileSize(stats.totalResultSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isComplete ? (
          <>
            <Button
              onClick={handleProcess}
              loading={isProcessing}
              className="flex-1"
            >
              {actionIcon} {actionLabel} {files.length} {files.length === 1 ? 'Image' : 'Images'}
            </Button>
            <Button variant="outline" onClick={onClear} disabled={isProcessing}>
              Clear
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleDownloadAll}
              loading={isCreatingZip}
              className="flex-1"
            >
              📥 Download {successfulJobs.length > 1 ? 'All (ZIP)' : 'Result'}
            </Button>
            <Button variant="outline" onClick={onClear}>
              Process More
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
