'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { triggerDownload } from '@/lib/utils/download';
import {
  PASSPORT_PRESETS,
  PassportPhotoPreset,
  PassportPhotoValidation,
  FaceDetectionResult,
  generatePassportPhoto,
  generatePrintLayout,
  getPresetsByCountry,
} from '@/lib/image/passportPhoto';

type ProcessingStage = 'idle' | 'detecting' | 'processing' | 'complete';

export default function PassportPhotoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [printLayoutBlob, setPrintLayoutBlob] = useState<Blob | null>(null);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPreset, setSelectedPreset] = useState<PassportPhotoPreset>(PASSPORT_PRESETS['india-passport']);
  const [replaceBackground, setReplaceBackground] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [validation, setValidation] = useState<PassportPhotoValidation | null>(null);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionResult | null>(null);
  
  const [printPaperSize, setPrintPaperSize] = useState<'4x6' | '5x7' | 'a4'>('4x6');
  const [printCopies, setPrintCopies] = useState(8);

  const presetsByCountry = getPresetsByCountry();

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (resultPreview) URL.revokeObjectURL(resultPreview);
    };
  }, []);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setResultBlob(null);
    setResultPreview(null);
    setPrintLayoutBlob(null);
    setValidation(null);
    setFaceDetection(null);
    
    // Create preview
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    // Auto-process
    await processPhoto(selectedFile, selectedPreset);
  }, [selectedPreset, preview]);

  const processPhoto = async (imageFile: File, preset: PassportPhotoPreset) => {
    setStage('detecting');
    setProgress(0);
    setProgressMessage('Analyzing photo...');
    
    try {
      const result = await generatePassportPhoto(imageFile, preset, {
        replaceBackground,
        backgroundColor,
        onProgress: (prog, message) => {
          setProgress(prog);
          setProgressMessage(message);
          if (prog > 30) setStage('processing');
        },
      });
      
      // Cleanup old preview
      if (resultPreview) URL.revokeObjectURL(resultPreview);
      
      setResultBlob(result.croppedImage);
      setResultPreview(URL.createObjectURL(result.croppedImage));
      setValidation(result.validation);
      setFaceDetection(result.faceDetection);
      
      // Generate print layout
      const printLayout = await generatePrintLayout(result.croppedImage, preset, {
        paperSize: printPaperSize,
        copies: printCopies,
      });
      setPrintLayoutBlob(printLayout);
      
      setStage('complete');
      setProgress(100);
      setProgressMessage('Photo ready!');
    } catch (err) {
      console.error('Passport photo generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate passport photo');
      setStage('idle');
    }
  };

  const handleReprocess = async () => {
    if (file) {
      await processPhoto(file, selectedPreset);
    }
  };

  const handlePresetChange = async (presetId: string) => {
    const preset = PASSPORT_PRESETS[presetId];
    if (preset) {
      setSelectedPreset(preset);
      if (file) {
        await processPhoto(file, preset);
      }
    }
  };

  const handleDownloadPhoto = () => {
    if (resultBlob && file) {
      const filename = file.name.replace(/\.[^.]+$/, `_${selectedPreset.id}.png`);
      triggerDownload({ blob: resultBlob, filename });
    }
  };

  const handleDownloadPrintLayout = () => {
    if (printLayoutBlob && file) {
      const filename = file.name.replace(/\.[^.]+$/, `_${selectedPreset.id}_print.jpg`);
      triggerDownload({ blob: printLayoutBlob, filename });
    }
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultPreview) URL.revokeObjectURL(resultPreview);
    
    setFile(null);
    setPreview(null);
    setResultBlob(null);
    setResultPreview(null);
    setPrintLayoutBlob(null);
    setStage('idle');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setValidation(null);
    setFaceDetection(null);
  };

  const isProcessing = stage === 'detecting' || stage === 'processing';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">📸</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Passport Photo Generator</h1>
          <p className="text-gray-600 mt-2">Create passport-compliant photos for any country - instant & free</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!file ? (
            <div className="space-y-6">
              {/* Guidelines */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Photo Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use a recent photo with a clear, front-facing view</li>
                  <li>• Ensure good lighting with no harsh shadows</li>
                  <li>• Keep a neutral expression with eyes open</li>
                  <li>• Use a plain background (we can replace it automatically)</li>
                  <li>• Remove glasses, hats, and head coverings (unless religious)</li>
                </ul>
              </div>

              <FileDropzone
                acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                maxFileSize={50 * 1024 * 1024}
                maxFiles={1}
                onFilesSelected={handleFileSelect}
              />
              
              <div className="text-center text-sm text-gray-500">
                <p>🔒 Your photos are processed locally - nothing is uploaded to any server</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <ProgressBar progress={progress} status="processing" />
                  <p className="text-sm text-center text-gray-600">{progressMessage}</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview Area */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Original */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Original</h3>
                      <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center">
                        {preview && (
                          <img 
                            src={preview} 
                            alt="Original" 
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Result */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">
                        Passport Photo ({selectedPreset.widthMm}×{selectedPreset.heightMm}mm)
                      </h3>
                      <div 
                        className="bg-gray-100 rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center"
                        style={{
                          backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                          backgroundSize: '10px 10px',
                          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                        }}
                      >
                        {resultPreview ? (
                          <img 
                            src={resultPreview} 
                            alt="Passport Photo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : isProcessing ? (
                          <div className="text-gray-400">Processing...</div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Validation Checklist */}
                  {validation && (
                    <div className={`rounded-lg p-4 ${validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <h3 className={`font-semibold mb-2 ${validation.isValid ? 'text-green-800' : 'text-yellow-800'}`}>
                        {validation.isValid ? '✅ Photo Validation Passed' : '⚠️ Photo Validation'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className={validation.checks.faceDetected ? 'text-green-700' : 'text-red-700'}>
                          {validation.checks.faceDetected ? '✓' : '✗'} Face Detected
                        </div>
                        <div className={validation.checks.faceCentered ? 'text-green-700' : 'text-red-700'}>
                          {validation.checks.faceCentered ? '✓' : '✗'} Face Centered
                        </div>
                        <div className={validation.checks.faceSize ? 'text-green-700' : 'text-red-700'}>
                          {validation.checks.faceSize ? '✓' : '✗'} Face Size OK
                        </div>
                        <div className={validation.checks.eyesVisible ? 'text-green-700' : 'text-red-700'}>
                          {validation.checks.eyesVisible ? '✓' : '✗'} Eyes Visible
                        </div>
                        <div className={validation.checks.properLighting ? 'text-green-700' : 'text-red-700'}>
                          {validation.checks.properLighting ? '✓' : '✗'} Good Lighting
                        </div>
                        <div className={validation.checks.backgroundUniform ? 'text-green-700' : 'text-red-700'}>
                          {validation.checks.backgroundUniform ? '✓' : '✗'} Uniform Background
                        </div>
                      </div>
                      {validation.messages.length > 1 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {validation.messages.slice(1).map((msg, i) => (
                            <p key={i}>• {msg}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings Panel */}
                <div className="space-y-4">
                  {/* Preset Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={selectedPreset.id}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(presetsByCountry).map(([country, presets]) => (
                        <optgroup key={country} label={country}>
                          {presets.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.name} ({preset.widthMm}×{preset.heightMm}mm)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Background Options */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={replaceBackground}
                        onChange={(e) => setReplaceBackground(e.target.checked)}
                        disabled={isProcessing}
                        className="rounded border-gray-300"
                      />
                      Replace Background
                    </label>
                    {replaceBackground && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          disabled={isProcessing}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <div className="flex gap-1">
                          {['#ffffff', '#f0f0f0', '#e8f4f8', '#d4e5f7'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setBackgroundColor(color)}
                              disabled={isProcessing}
                              className={`w-8 h-8 rounded border-2 ${backgroundColor === color ? 'border-blue-500' : 'border-gray-200'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Print Layout Options */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Print Layout</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Paper Size</label>
                        <select
                          value={printPaperSize}
                          onChange={(e) => setPrintPaperSize(e.target.value as '4x6' | '5x7' | 'a4')}
                          disabled={isProcessing}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="4x6">4×6 inch</option>
                          <option value="5x7">5×7 inch</option>
                          <option value="a4">A4</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Copies</label>
                        <select
                          value={printCopies}
                          onChange={(e) => setPrintCopies(Number(e.target.value))}
                          disabled={isProcessing}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          {[4, 6, 8, 10, 12].map((n) => (
                            <option key={n} value={n}>{n} photos</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reprocess Button */}
                  {stage === 'complete' && (
                    <Button 
                      variant="outline" 
                      onClick={handleReprocess}
                      className="w-full"
                    >
                      🔄 Regenerate with New Settings
                    </Button>
                  )}

                  {/* Info */}
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    <p>💡 <strong>{selectedPreset.name}</strong></p>
                    <p className="text-xs mt-1">
                      Size: {selectedPreset.widthMm}×{selectedPreset.heightMm}mm ({selectedPreset.width}×{selectedPreset.height}px at {selectedPreset.dpi}dpi)
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {stage === 'complete' && resultBlob ? (
                  <>
                    <Button onClick={handleDownloadPhoto} className="flex-1">
                      📥 Download Photo
                    </Button>
                    {printLayoutBlob && (
                      <Button variant="outline" onClick={handleDownloadPrintLayout} className="flex-1">
                        🖨️ Download Print Layout
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleClear}>
                      New Photo
                    </Button>
                  </>
                ) : (
                  <>
                    <Button disabled={isProcessing} loading={isProcessing} className="flex-1">
                      {isProcessing ? 'Processing...' : 'Processing'}
                    </Button>
                    <Button variant="outline" onClick={handleClear} disabled={isProcessing}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">🎯</span>
            <h3 className="font-semibold text-gray-900 mb-2">Auto Face Detection</h3>
            <p className="text-sm text-gray-600">
              AI automatically detects and centers your face for perfect passport photos.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">✂️</span>
            <h3 className="font-semibold text-gray-900 mb-2">Background Removal</h3>
            <p className="text-sm text-gray-600">
              Automatically removes and replaces background with compliant colors.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">✅</span>
            <h3 className="font-semibold text-gray-900 mb-2">Validation Check</h3>
            <p className="text-sm text-gray-600">
              Validates your photo against official passport requirements.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">🖨️</span>
            <h3 className="font-semibold text-gray-900 mb-2">Print Ready</h3>
            <p className="text-sm text-gray-600">
              Generate print layouts with multiple copies for easy printing.
            </p>
          </div>
        </div>

        {/* Supported Documents */}
        <div className="mt-12 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Supported Documents</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(presetsByCountry).map(([country, presets]) => (
              <div key={country}>
                <h3 className="font-semibold text-gray-700 mb-2">{country}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {presets.map((preset) => (
                    <li key={preset.id}>• {preset.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
