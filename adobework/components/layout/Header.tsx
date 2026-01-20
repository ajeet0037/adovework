'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface ToolLink {
  href: string;
  label: string;
  icon: string;
  description: string;
}

interface ToolCategory {
  name: string;
  icon: string;
  color: string;
  tools: ToolLink[];
}

const toolCategories: ToolCategory[] = [
  {
    name: 'PDF Tools',
    icon: 'PDF',
    color: 'from-red-500 to-orange-500',
    tools: [
      { href: '/merge-pdf', label: 'Merge PDF', icon: 'M', description: 'Combine multiple PDFs' },
      { href: '/split-pdf', label: 'Split PDF', icon: 'S', description: 'Divide PDF into parts' },
      { href: '/compress-pdf', label: 'Compress PDF', icon: 'C', description: 'Reduce file size' },
      { href: '/reorder-pdf', label: 'Organize PDF', icon: 'O', description: 'Rearrange pages' },
      { href: '/page-numbers', label: 'Page Numbers', icon: '#', description: 'Add page numbers' },
      { href: '/rotate-pdf', label: 'Rotate PDF', icon: 'R', description: 'Rotate pages' },
    ],
  },
  {
    name: 'Convert',
    icon: 'CV',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      { href: '/pdf-to-word', label: 'PDF to Word', icon: 'W', description: 'PDF to DOCX' },
      { href: '/word-to-pdf', label: 'Word to PDF', icon: 'P', description: 'DOCX to PDF' },
      { href: '/pdf-to-excel', label: 'PDF to Excel', icon: 'X', description: 'PDF to XLSX' },
      { href: '/excel-to-pdf', label: 'Excel to PDF', icon: 'E', description: 'XLSX to PDF' },
      { href: '/pdf-to-ppt', label: 'PDF to PPT', icon: 'PP', description: 'PDF to PPTX' },
      { href: '/ppt-to-pdf', label: 'PPT to PDF', icon: 'PT', description: 'PPTX to PDF' },
      { href: '/image-to-pdf', label: 'Image to PDF', icon: 'I', description: 'JPG/PNG to PDF' },
      { href: '/html-to-pdf', label: 'HTML to PDF', icon: 'H', description: 'Web to PDF' },
      { href: '/pdf-to-pdfa', label: 'PDF to PDF/A', icon: 'A', description: 'Archive format' },
    ],
  },
  {
    name: 'Edit PDF',
    icon: 'ED',
    color: 'from-purple-500 to-indigo-500',
    tools: [
      { href: '/edit-pdf', label: 'Edit PDF', icon: 'E', description: 'Edit and annotate' },
      { href: '/crop-pdf', label: 'Crop PDF', icon: 'CR', description: 'Crop pages' },
      { href: '/watermark-pdf', label: 'Watermark', icon: 'WM', description: 'Add watermark' },
      { href: '/sign-pdf', label: 'Sign PDF', icon: 'SG', description: 'Add signature' },
      { href: '/redact-pdf', label: 'Redact PDF', icon: 'RD', description: 'Hide sensitive info' },
    ],
  },
  {
    name: 'Security',
    icon: 'SC',
    color: 'from-green-500 to-emerald-500',
    tools: [
      { href: '/protect-pdf', label: 'Protect PDF', icon: 'LK', description: 'Add password' },
      { href: '/unlock-pdf', label: 'Unlock PDF', icon: 'UL', description: 'Remove password' },
    ],
  },
  {
    name: 'Image Tools',
    icon: 'IMG',
    color: 'from-pink-500 to-rose-500',
    tools: [
      { href: '/resize-image', label: 'Resize Image', icon: 'RS', description: 'Change dimensions' },
      { href: '/compress-image', label: 'Compress Image', icon: 'CP', description: 'Reduce size' },
      { href: '/convert-image', label: 'Convert Image', icon: 'CV', description: 'Change format' },
      { href: '/crop-rotate-image', label: 'Crop and Rotate', icon: 'CR', description: 'Edit images' },
      { href: '/remove-background', label: 'Remove BG', icon: 'BG', description: 'AI background removal' },
      { href: '/photo-editor', label: 'Photo Editor', icon: 'PE', description: 'Edit and enhance' },
      { href: '/upscale-image', label: 'Upscale Image', icon: 'UP', description: 'Enhance resolution' },
      { href: '/passport-photo', label: 'Passport Photo', icon: 'ID', description: 'ID photos' },
    ],
  },
  {
    name: 'More Tools',
    icon: 'MT',
    color: 'from-amber-500 to-orange-500',
    tools: [
      { href: '/ocr-pdf', label: 'OCR PDF', icon: 'OC', description: 'Extract text from scans' },
      { href: '/repair-pdf', label: 'Repair PDF', icon: 'RP', description: 'Fix corrupted PDFs' },
      { href: '/compare-pdf', label: 'Compare PDF', icon: 'CM', description: 'Find differences' },
      { href: '/scan-to-pdf', label: 'Scan to PDF', icon: 'SC', description: 'Scan documents' },
    ],
  },
];


// Logo Component - Simplified for faster render
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </div>
      <span className="text-lg font-bold text-gray-900">AdobeWork</span>
    </Link>
  );
}

// Mega Menu Dropdown
function MegaDropdown({ 
  category, 
  isOpen, 
  onMouseEnter, 
  onMouseLeave 
}: { 
  category: ToolCategory; 
  isOpen: boolean; 
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const toolCount = category.tools.length;
  const gridCols = toolCount <= 4 ? 'grid-cols-1' : 'grid-cols-2';
  const width = toolCount <= 4 ? 'w-[280px]' : 'w-[480px]';

  return (
    <div 
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isOpen 
            ? 'bg-gray-100 text-primary-600' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
        }`}
      >
        <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${category.color} text-white text-[10px] font-bold flex items-center justify-center`}>
          {category.icon}
        </span>
        <span>{category.name}</span>
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 ${width} bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50`}>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
              {category.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-500">Select a tool to get started</p>
            </div>
          </div>
          
          <div className={`grid ${gridCols} gap-1`}>
            {category.tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                  {tool.icon}
                </span>
                <div>
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {tool.label}
                  </span>
                  <span className="block text-xs text-gray-500">{tool.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm" ref={headerRef}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          <nav className="hidden lg:flex lg:items-center lg:gap-0.5">
            {toolCategories.map((category) => (
              <MegaDropdown
                key={category.name}
                category={category}
                isOpen={openDropdown === category.name}
                onMouseEnter={() => handleMouseEnter(category.name)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
            <Link 
              href="/all-tools" 
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50 transition-colors ml-2"
            >
              <span>All Tools</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>

          <button
            type="button"
            className="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-gray-200 py-4 max-h-[75vh] overflow-y-auto">
            {toolCategories.map((category) => (
              <div key={category.name} className="mb-2">
                <button
                  onClick={() => setMobileExpandedCategory(mobileExpandedCategory === category.name ? null : category.name)}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    mobileExpandedCategory === category.name 
                      ? 'bg-gray-100 text-primary-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {category.icon}
                    </div>
                    <span>{category.name}</span>
                    <span className="text-xs text-gray-400">({category.tools.length})</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 transition-transform ${mobileExpandedCategory === category.name ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileExpandedCategory === category.name && (
                  <div className="mt-2 ml-4 grid grid-cols-2 gap-1">
                    {category.tools.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 text-[10px] font-semibold flex items-center justify-center">
                          {tool.icon}
                        </span>
                        <span>{tool.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/all-tools"
              className="flex items-center gap-3 px-4 py-3 mt-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>View All Tools</span>
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
