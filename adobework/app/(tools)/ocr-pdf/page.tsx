'use client';

import dynamic from 'next/dynamic';

// Dynamically import the OCR component with SSR disabled
const OcrPdfContent = dynamic(() => import('./OcrPdfContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <span className="text-3xl">👁️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">OCR PDF</h1>
          <p className="text-gray-600 mt-2">Loading OCR engine...</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    </div>
  ),
});

export default function OcrPdfPage() {
  return <OcrPdfContent />;
}
