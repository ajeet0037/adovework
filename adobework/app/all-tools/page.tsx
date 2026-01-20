'use client';

import Link from 'next/link';

interface Tool {
  href: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface Category {
  name: string;
  description: string;
  tools: Tool[];
}

const categories: Category[] = [
  {
    name: 'Merge & Organize',
    description: 'Combine, split, and organize your PDF pages',
    tools: [
      { href: '/merge-pdf', label: 'Merge PDF', description: 'Combine multiple PDFs into one', icon: '📑', color: 'bg-blue-500' },
      { href: '/split-pdf', label: 'Split PDF', description: 'Extract pages from PDF', icon: '✂️', color: 'bg-orange-500' },
      { href: '/reorder-pdf', label: 'Organize PDF', description: 'Rearrange PDF pages', icon: '📋', color: 'bg-purple-500' },
      { href: '/rotate-pdf', label: 'Rotate PDF', description: 'Rotate PDF pages', icon: '🔄', color: 'bg-cyan-500' },
    ],
  },
  {
    name: 'Convert to PDF',
    description: 'Convert various file formats to PDF',
    tools: [
      { href: '/word-to-pdf', label: 'Word to PDF', description: 'Convert Word documents', icon: '📝', color: 'bg-blue-600' },
      { href: '/excel-to-pdf', label: 'Excel to PDF', description: 'Convert Excel spreadsheets', icon: '📊', color: 'bg-green-600' },
      { href: '/ppt-to-pdf', label: 'PPT to PDF', description: 'Convert PowerPoint slides', icon: '📽️', color: 'bg-orange-600' },
      { href: '/image-to-pdf', label: 'Image to PDF', description: 'Convert images to PDF', icon: '🖼️', color: 'bg-pink-500' },
    ],
  },
  {
    name: 'Convert from PDF',
    description: 'Convert PDF to other formats',
    tools: [
      { href: '/pdf-to-word', label: 'PDF to Word', description: 'Convert to Word document', icon: '📄', color: 'bg-blue-600' },
      { href: '/pdf-to-excel', label: 'PDF to Excel', description: 'Convert to Excel spreadsheet', icon: '📈', color: 'bg-green-600' },
      { href: '/pdf-to-ppt', label: 'PDF to PPT', description: 'Convert to PowerPoint', icon: '🎬', color: 'bg-orange-600' },
    ],
  },
  {
    name: 'Image Tools',
    description: 'Edit, convert, and enhance your images',
    tools: [
      { href: '/resize-image', label: 'Resize Image', description: 'Resize to any dimension', icon: '📐', color: 'bg-blue-500' },
      { href: '/compress-image', label: 'Compress Image', description: 'Reduce image file size', icon: '🗜️', color: 'bg-green-500' },
      { href: '/convert-image', label: 'Convert Image', description: 'Convert between formats', icon: '🔄', color: 'bg-orange-500' },
      { href: '/crop-rotate-image', label: 'Crop & Rotate', description: 'Crop and rotate images', icon: '✂️', color: 'bg-cyan-500' },
      { href: '/photo-editor', label: 'Photo Editor', description: 'Adjust filters and effects', icon: '🎨', color: 'bg-pink-500' },
      { href: '/add-text-sticker', label: 'Text & Stickers', description: 'Add text and stickers', icon: '✏️', color: 'bg-indigo-500' },
      { href: '/remove-background', label: 'Remove Background', description: 'AI-powered background removal', icon: '🎭', color: 'bg-purple-500' },
      { href: '/upscale-image', label: 'Upscale Image', description: 'AI-powered image upscaling', icon: '🔍', color: 'bg-teal-500' },
      { href: '/passport-photo', label: 'Passport Photo', description: 'Create ID photos', icon: '🪪', color: 'bg-red-500' },
    ],
  },
  {
    name: 'Edit & Optimize',
    description: 'Edit, compress, and enhance your PDFs',
    tools: [
      { href: '/edit-pdf', label: 'Edit PDF', description: 'Edit text and images in PDF', icon: '✏️', color: 'bg-purple-600' },
      { href: '/compress-pdf', label: 'Compress PDF', description: 'Reduce PDF file size', icon: '📦', color: 'bg-green-500' },
      { href: '/crop-pdf', label: 'Crop PDF', description: 'Trim PDF margins', icon: '✂️', color: 'bg-orange-500' },
      { href: '/watermark-pdf', label: 'Watermark', description: 'Add watermark to PDF', icon: '💧', color: 'bg-cyan-500' },
      { href: '/page-numbers', label: 'Page Numbers', description: 'Add page numbers', icon: '🔢', color: 'bg-blue-500' },
    ],
  },
  {
    name: 'Security',
    description: 'Protect and secure your PDF documents',
    tools: [
      { href: '/protect-pdf', label: 'Protect PDF', description: 'Add password protection', icon: '🔒', color: 'bg-red-500' },
      { href: '/unlock-pdf', label: 'Unlock PDF', description: 'Remove PDF password', icon: '🔓', color: 'bg-green-500' },
      { href: '/sign-pdf', label: 'Sign PDF', description: 'Add digital signature', icon: '✍️', color: 'bg-indigo-500' },
      { href: '/redact-pdf', label: 'Redact PDF', description: 'Black out sensitive info', icon: '█', color: 'bg-gray-700' },
    ],
  },
  {
    name: 'Advanced Tools',
    description: 'Specialized PDF processing tools',
    tools: [
      { href: '/ocr-pdf', label: 'OCR PDF', description: 'Extract text from scans', icon: '👁️', color: 'bg-purple-500' },
      { href: '/html-to-pdf', label: 'HTML to PDF', description: 'Convert web pages', icon: '🌐', color: 'bg-cyan-500' },
      { href: '/pdf-to-pdfa', label: 'PDF to PDF/A', description: 'Archive format', icon: '📚', color: 'bg-amber-500' },
      { href: '/repair-pdf', label: 'Repair PDF', description: 'Fix corrupted PDFs', icon: '🔧', color: 'bg-orange-500' },
      { href: '/compare-pdf', label: 'Compare PDF', description: 'Find differences', icon: '🔍', color: 'bg-blue-500' },
      { href: '/scan-to-pdf', label: 'Scan to PDF', description: 'Scan documents', icon: '📷', color: 'bg-green-500' },
    ],
  },
];

export default function AllToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">All PDF Tools</h1>
          <p className="text-lg text-white/90">Everything you need to work with PDFs, all in one place</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.map((category) => (
          <div key={category.name} className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
              <p className="text-gray-600 mt-1">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center text-2xl mb-3`}>
                    {tool.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {tool.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
