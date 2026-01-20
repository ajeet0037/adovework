'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { triggerDownload } from '@/lib/utils/download';

export default function HtmlToPdfPage() {
  const [mode, setMode] = useState<'url' | 'html'>('url');
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (mode === 'html' && htmlContent.trim()) {
        // Create PDF from HTML content
        const pdf = await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
        
        // Parse HTML and extract text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.innerText || tempDiv.textContent || '';
        
        // Split into lines
        const lines = textContent.split('\n').filter(line => line.trim());
        const pageWidth = 595; // A4 width in points
        const pageHeight = 842; // A4 height in points
        const margin = 50;
        const lineHeight = 16;
        const maxWidth = pageWidth - (margin * 2);
        
        let page = pdf.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;
        
        for (const line of lines) {
          // Word wrap
          const words = line.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, 12);
            
            if (width > maxWidth && currentLine) {
              // Draw current line
              if (y < margin + lineHeight) {
                page = pdf.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
              }
              page.drawText(currentLine, { x: margin, y, size: 12, font, color: rgb(0, 0, 0) });
              y -= lineHeight;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          // Draw remaining text
          if (currentLine) {
            if (y < margin + lineHeight) {
              page = pdf.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
            page.drawText(currentLine, { x: margin, y, size: 12, font, color: rgb(0, 0, 0) });
            y -= lineHeight;
          }
        }
        
        const pdfBytes = await pdf.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        triggerDownload({ blob, filename: 'converted_html.pdf' });
      } else if (mode === 'url' && url.trim()) {
        setError('For security reasons, please open the URL and use your browser\'s "Print to PDF" feature (Ctrl+P / Cmd+P)');
        window.open(url, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-2xl mb-4">
            <span className="text-3xl">🌐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HTML to PDF</h1>
          <p className="text-gray-600 mt-2">Convert HTML content or web pages to PDF</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Mode selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('html')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'html' ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-500' : 'bg-gray-100 text-gray-600 border-2 border-transparent'
              }`}
            >
              📝 Paste HTML Code
            </button>
            <button
              onClick={() => setMode('url')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'url' ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-500' : 'bg-gray-100 text-gray-600 border-2 border-transparent'
              }`}
            >
              🔗 Enter URL
            </button>
          </div>

          {mode === 'html' ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">HTML Content</label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<h1>Hello World</h1>\n<p>Your HTML content here...</p>"
                className="w-full h-64 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-cyan-500 focus:border-cyan-500"
              />
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Preview:</h4>
                <div 
                  className="bg-white border border-gray-200 rounded p-4 min-h-[100px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Note:</strong> Due to browser security restrictions, URL conversion will open the page in a new tab. 
                Use your browser&apos;s Print function (Ctrl+P / Cmd+P) and select &quot;Save as PDF&quot;.
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={handleConvert}
              loading={isProcessing}
              disabled={mode === 'html' ? !htmlContent.trim() : !url.trim()}
              className="w-full"
            >
              {mode === 'html' ? '📥 Convert & Download PDF' : 'Open URL'}
            </Button>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">💡 Tips:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• For HTML mode, PDF will be downloaded directly</li>
              <li>• Basic HTML tags like headings, paragraphs are supported</li>
              <li>• For URL mode, use browser&apos;s Print to PDF feature</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
