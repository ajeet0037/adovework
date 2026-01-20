'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Annotation,
  RGBColor,
  createTextAnnotation,
  createHighlightAnnotation,
  createDrawAnnotation,
} from '@/lib/pdf/edit';

export interface AdvancedPdfEditorProps {
  pdfBuffer: ArrayBuffer | null;
  currentPage: number;
  totalPages: number;
  pageDimensions: { width: number; height: number };
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  initialAnnotations?: Annotation[];
  disabled?: boolean;
  onPageChange?: (page: number) => void;
}

type EditorTool = 'select' | 'text' | 'sign' | 'draw' | 'image' | 'highlight';

interface ExtractedText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  page: number;
}

interface TextEdit {
  originalId: string;
  newText: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  page: number;
  isDeleted: boolean;
}

interface HistoryState {
  textEdits: Map<string, TextEdit>;
  annotations: Annotation[];
}

const COLORS: { name: string; value: RGBColor; hex: string }[] = [
  { name: 'Black', value: { r: 0, g: 0, b: 0 }, hex: '#000000' },
  { name: 'Red', value: { r: 220, g: 38, b: 38 }, hex: '#dc2626' },
  { name: 'Blue', value: { r: 37, g: 99, b: 235 }, hex: '#2563eb' },
  { name: 'Green', value: { r: 22, g: 163, b: 74 }, hex: '#16a34a' },
  { name: 'Yellow', value: { r: 234, g: 179, b: 8 }, hex: '#eab308' },
  { name: 'Purple', value: { r: 147, g: 51, b: 234 }, hex: '#9333ea' },
  { name: 'Orange', value: { r: 249, g: 115, b: 22 }, hex: '#f97316' },
  { name: 'White', value: { r: 255, g: 255, b: 255 }, hex: '#ffffff' },
];

const FONTS = [
  { name: 'Times', value: 'Times New Roman, Times, serif' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Courier', value: 'Courier New, Courier, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
];

const FONT_SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72];

type AnnotationWithStyle = Annotation & { fontFamily?: string; isBold?: boolean; isItalic?: boolean; };

export function AdvancedPdfEditor({
  pdfBuffer, currentPage, totalPages, pageDimensions,
  onAnnotationsChange, initialAnnotations = [], disabled = false, onPageChange,
}: AdvancedPdfEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  // Core state
  const [annotations, setAnnotations] = useState<AnnotationWithStyle[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Text editing
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [textEdits, setTextEdits] = useState<Map<string, TextEdit>>(new Map());
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Formatting
  const [activeColor, setActiveColor] = useState<RGBColor>(COLORS[0].value);
  const [activeFont, setActiveFont] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState(12);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);

  // Add text mode
  const [addTextMode, setAddTextMode] = useState(false);
  const [newTextPosition, setNewTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [newTextValue, setNewTextValue] = useState('');

  // History for undo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const displayWidth = Math.round(pageDimensions.width * zoom);
  const displayHeight = Math.round(pageDimensions.height * zoom);

  // Save state to history
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      textEdits: new Map(textEdits),
      annotations: [...annotations],
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [textEdits, annotations, history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setTextEdits(new Map(prevState.textEdits));
      setAnnotations([...prevState.annotations]);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setTextEdits(new Map(nextState.textEdits));
      setAnnotations([...nextState.annotations]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Load PDF
  useEffect(() => {
    if (!pdfBuffer) return;
    const loadPdf = async () => {
      try {
        setIsRendering(true);
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source
        if (typeof window !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        // Create a copy of the buffer to prevent detachment issues
        const bufferCopy = pdfBuffer.slice(0);

        // Use environment variable for CDN URL or fallback to unpkg
        const cdnBase = process.env.NEXT_PUBLIC_PDFJS_CDN_URL || 'https://unpkg.com/pdfjs-dist@4.10.38';

        const loadingTask = pdfjsLib.getDocument({
          data: bufferCopy,
          cMapUrl: `${cdnBase}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${cdnBase}/standard_fonts/`,
        });

        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      } catch (error) {
        console.error('Failed to load PDF:', error);
      } finally {
        setIsRendering(false);
      }
    };
    loadPdf();
  }, [pdfBuffer]);


  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const renderPage = async () => {
      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const viewport = page.getViewport({ scale: zoom * 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Extract text
        const textContent = await page.getTextContent();
        const texts: ExtractedText[] = [];
        for (const item of textContent.items) {
          if ('str' in item && item.str.trim()) {
            const tx = item.transform;
            texts.push({
              id: `text_${currentPage}_${texts.length}`,
              text: item.str,
              x: tx[4],
              y: pageDimensions.height - tx[5],
              width: item.width || 100,
              height: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * 1.2,
              fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]),
              fontFamily: 'fontName' in item ? String(item.fontName) : 'Helvetica',
              page: currentPage,
            });
          }
        }
        setExtractedTexts(texts);
        setSelectedTextId(null);
      } catch (error) {
        console.error('Failed to render:', error);
      } finally {
        setIsRendering(false);
      }
    };
    renderPage();
  }, [pdfDoc, currentPage, zoom, displayWidth, displayHeight, pageDimensions.height]);

  // Only set initial annotations once on mount, not on every change
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && initialAnnotations.length > 0) {
      setAnnotations(initialAnnotations);
      initializedRef.current = true;
    }
  }, [initialAnnotations]);

  // Convert textEdits to annotations and notify parent
  const extractedTextsRef = useRef<ExtractedText[]>([]);
  const onAnnotationsChangeRef = useRef(onAnnotationsChange);

  // Keep refs updated
  useEffect(() => {
    extractedTextsRef.current = extractedTexts;
  }, [extractedTexts]);

  useEffect(() => {
    onAnnotationsChangeRef.current = onAnnotationsChange;
  }, [onAnnotationsChange]);

  // Notify parent when textEdits or annotations change
  useEffect(() => {
    const editAnnotations: Annotation[] = [];
    const pageHeight = pageDimensions.height;

    textEdits.forEach((edit, id) => {
      const original = extractedTextsRef.current.find(t => t.id === id);
      if (!original) return;

      // PDF coordinates: y is from bottom of page
      // original.y is screen coordinate (from top), so PDF y = pageHeight - original.y
      const pdfY = pageHeight - original.y;

      // White cover to hide original text
      // Cover should start below baseline and extend above
      const coverAnnotation = createHighlightAnnotation(
        edit.page,
        original.x - 2,
        pdfY - original.fontSize * 0.3,  // Start below baseline
        original.width + 10,
        original.fontSize * 1.4,
        { color: { r: 255, g: 255, b: 255 }, opacity: 1 }
      );
      editAnnotations.push(coverAnnotation);

      // New text if not deleted - at same baseline position
      if (!edit.isDeleted && edit.newText.trim()) {
        const textAnnotation = createTextAnnotation(
          edit.page,
          original.x,
          pdfY,  // Same baseline as original
          edit.newText,
          { color: { r: 0, g: 0, b: 0 }, fontSize: Math.round(original.fontSize) }
        );
        editAnnotations.push(textAnnotation);
      }
    });

    const allAnnotations = [...editAnnotations, ...annotations];
    onAnnotationsChangeRef.current?.(allAnnotations);
  }, [textEdits, annotations, pageDimensions.height]);

  const rgbToHex = (c: RGBColor) => `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;

  // Text editing handlers
  const handleTextClick = (text: ExtractedText) => {
    if (disabled || activeTool !== 'text') return;
    setSelectedTextId(text.id);
    const edit = textEdits.get(text.id);
    setEditingText(edit ? edit.newText : text.text);
    setFontSize(Math.round(text.fontSize));
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const handleTextChange = (newText: string) => {
    setEditingText(newText);
    if (!selectedTextId) return;
    const original = extractedTexts.find(t => t.id === selectedTextId);
    if (!original) return;

    const newEdits = new Map(textEdits);
    newEdits.set(selectedTextId, {
      originalId: selectedTextId, newText, x: original.x, y: original.y,
      fontSize: original.fontSize, fontFamily: original.fontFamily,
      page: currentPage, isDeleted: newText.length === 0,
    });
    setTextEdits(newEdits);
  };

  const handleDeleteText = () => {
    if (!selectedTextId) return;
    saveToHistory();
    handleTextChange('');
    setSelectedTextId(null);
    setEditingText('');
  };

  const handleCloseEditor = () => {
    if (selectedTextId && editingText !== extractedTexts.find(t => t.id === selectedTextId)?.text) {
      saveToHistory();
    }
    setSelectedTextId(null);
    setEditingText('');
  };

  const getDisplayText = (text: ExtractedText) => textEdits.get(text.id)?.newText ?? text.text;

  // Add new text
  const handleAddTextClick = (e: React.MouseEvent) => {
    if (!addTextMode || disabled) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setNewTextPosition({ x, y });
    setNewTextValue('');
  };

  const handleAddNewText = () => {
    if (!newTextPosition || !newTextValue.trim()) return;
    saveToHistory();
    const annotation = createTextAnnotation(
      currentPage, newTextPosition.x, pageDimensions.height - newTextPosition.y,
      newTextValue, { color: activeColor, fontSize }
    );
    setAnnotations(prev => [...prev, { ...annotation, fontFamily: activeFont, isBold, isItalic }]);
    setNewTextPosition(null);
    setNewTextValue('');
    setAddTextMode(false);
  };

  // Drawing handlers
  const handleDrawStart = (e: React.MouseEvent) => {
    if (activeTool !== 'draw' || disabled) return;
    const rect = drawCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    setDrawPoints([{ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }]);
  };

  const handleDrawMove = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const rect = drawCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newPoint = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
    setDrawPoints(prev => [...prev, newPoint]);

    // Draw on canvas
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx && drawPoints.length > 0) {
      ctx.strokeStyle = rgbToHex(activeColor);
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const last = drawPoints[drawPoints.length - 1];
      ctx.moveTo(last.x * zoom, last.y * zoom);
      ctx.lineTo(newPoint.x * zoom, newPoint.y * zoom);
      ctx.stroke();
    }
  };

  const handleDrawEnd = () => {
    if (!isDrawing || drawPoints.length < 2) { setIsDrawing(false); return; }
    saveToHistory();
    const pdfPoints = drawPoints.map(p => ({ x: p.x, y: pageDimensions.height - p.y }));
    const annotation = createDrawAnnotation(currentPage, pdfPoints, { color: activeColor, strokeWidth });
    setAnnotations(prev => [...prev, annotation]);
    setDrawPoints([]);
    setIsDrawing(false);
    // Clear draw canvas
    const ctx = drawCanvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, displayWidth, displayHeight);
  };

  // Icons
  const icons = {
    select: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>,
    text: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4v3h5.5v12h3V7H19V4H5z" /></svg>,
    sign: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    draw: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
    image: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    highlight: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242z" /></svg>,
    undo: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
    redo: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>,
    bold: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>,
    italic: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" /></svg>,
    delete: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    zoomIn: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    zoomOut: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>,
  };

  const tools: { id: EditorTool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select', icon: icons.select },
    { id: 'text', label: 'Text', icon: icons.text },
    { id: 'sign', label: 'Sign', icon: icons.sign },
    { id: 'draw', label: 'Draw', icon: icons.draw },
    { id: 'image', label: 'Image', icon: icons.image },
    { id: 'highlight', label: 'Highlight', icon: icons.highlight },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Main Toolbar - pdf.net style */}
      <div className="bg-white border-b border-gray-200 px-2 py-1 flex items-center gap-1">
        {tools.map(({ id, label, icon }) => (
          <button key={id} onClick={() => { setActiveTool(id); setAddTextMode(false); setSelectedTextId(null); }}
            disabled={disabled}
            className={`flex flex-col items-center px-2 py-1 rounded min-w-[45px] transition-colors ${activeTool === id ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
              }`}>
            {icon}
            <span className="text-[9px] mt-0.5">{label}</span>
          </button>
        ))}

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30" title="Undo">
          {icons.undo}
        </button>
        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30" title="Redo">
          {icons.redo}
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} disabled={zoom <= 0.5} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
          {icons.zoomOut}
        </button>
        <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} disabled={zoom >= 2} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
          {icons.zoomIn}
        </button>
      </div>

      {/* Secondary Toolbar - Text formatting */}
      {(activeTool === 'text' || activeTool === 'sign' || selectedTextId || addTextMode || newTextPosition) && (
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
          {/* Add text button */}
          <button onClick={() => { setAddTextMode(!addTextMode); setSelectedTextId(null); }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${addTextMode ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}>
            <span className="text-lg">+</span> Add text
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Color picker */}
          <div className="flex items-center gap-1">
            {COLORS.slice(0, 6).map(c => (
              <button key={c.name} onClick={() => setActiveColor(c.value)}
                className={`w-5 h-5 rounded-full border-2 ${activeColor.r === c.value.r && activeColor.g === c.value.g && activeColor.b === c.value.b ? 'border-purple-500' : 'border-gray-300'}`}
                style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Font */}
          <select value={activeFont} onChange={e => setActiveFont(e.target.value)}
            className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-white min-w-[100px]">
            {FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
          </select>

          {/* Size */}
          <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-white w-14">
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="w-px h-6 bg-gray-300" />

          {/* Bold/Italic */}
          <button onClick={() => setIsBold(!isBold)}
            className={`p-1.5 rounded ${isBold ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`} title="Bold">
            {icons.bold}
          </button>
          <button onClick={() => setIsItalic(!isItalic)}
            className={`p-1.5 rounded ${isItalic ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`} title="Italic">
            {icons.italic}
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Delete */}
          <button onClick={handleDeleteText} disabled={!selectedTextId}
            className="p-1.5 rounded hover:bg-red-100 hover:text-red-600 disabled:opacity-30" title="Delete">
            {icons.delete}
          </button>
        </div>
      )}

      {/* Draw toolbar */}
      {activeTool === 'draw' && (
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
          <span className="text-sm text-gray-600">Stroke:</span>
          <select value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-white w-16">
            {[1, 2, 3, 4, 5, 8, 10, 15].map(w => <option key={w} value={w}>{w}px</option>)}
          </select>
          <div className="w-px h-6 bg-gray-300" />
          {COLORS.slice(0, 6).map(c => (
            <button key={c.name} onClick={() => setActiveColor(c.value)}
              className={`w-5 h-5 rounded-full border-2 ${activeColor.r === c.value.r && activeColor.g === c.value.g && activeColor.b === c.value.b ? 'border-purple-500' : 'border-gray-300'}`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      )}

      {/* Text input bar when editing */}
      {selectedTextId && (
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2">
          <input ref={textInputRef} type="text" value={editingText} onChange={e => handleTextChange(e.target.value)}
            className="flex-1 max-w-md px-3 py-1 border border-gray-300 rounded text-sm"
            style={{ fontFamily: activeFont, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }}
            placeholder="Edit text..."
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') handleCloseEditor(); }} />
          <button onClick={handleCloseEditor} className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">Done</button>
        </div>
      )}

      {/* New text input */}
      {newTextPosition && (
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">New text:</span>
          <input type="text" value={newTextValue} onChange={e => setNewTextValue(e.target.value)} autoFocus
            className="flex-1 max-w-md px-3 py-1 border border-gray-300 rounded text-sm"
            style={{ fontFamily: activeFont, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }}
            placeholder="Type new text..."
            onKeyDown={e => { if (e.key === 'Enter') handleAddNewText(); if (e.key === 'Escape') { setNewTextPosition(null); setAddTextMode(false); } }} />
          <button onClick={handleAddNewText} className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">Add</button>
          <button onClick={() => { setNewTextPosition(null); setAddTextMode(false); }} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">Cancel</button>
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-gray-400 p-4">
        <div className="flex justify-center">
          <div className="relative bg-white shadow-xl" style={{ width: displayWidth, height: displayHeight }}>
            {/* PDF canvas */}
            <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ width: displayWidth, height: displayHeight }} />

            {/* Draw canvas */}
            <canvas ref={drawCanvasRef} width={displayWidth} height={displayHeight}
              className={`absolute top-0 left-0 ${activeTool === 'draw' ? 'cursor-crosshair' : 'pointer-events-none'}`}
              style={{ zIndex: 5 }}
              onMouseDown={handleDrawStart} onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd} />

            {/* Text overlay */}
            <div ref={overlayRef} className="absolute top-0 left-0" style={{ width: displayWidth, height: displayHeight, zIndex: 10 }}
              onClick={addTextMode ? handleAddTextClick : undefined}>

              {/* Clickable text areas */}
              {activeTool === 'text' && !addTextMode && extractedTexts.map(text => {
                const display = getDisplayText(text);
                if (!display) return null;
                return (
                  <div key={text.id} onClick={() => handleTextClick(text)}
                    className={`absolute cursor-text ${selectedTextId === text.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
                    style={{
                      left: text.x * zoom,
                      top: (text.y - text.fontSize * 1.1) * zoom,
                      minWidth: text.width * zoom,
                      minHeight: text.fontSize * 1.3 * zoom,
                      fontSize: text.fontSize * zoom,
                      color: 'transparent',
                    }}>
                    {display}
                  </div>
                );
              })}

              {/* Edited text overlays */}
              {Array.from(textEdits.values()).filter(e => e.page === currentPage).map(edit => {
                const orig = extractedTexts.find(t => t.id === edit.originalId);
                if (!orig || (!edit.isDeleted && edit.newText === orig.text)) return null;

                // orig.y is screen coordinate (baseline from top)
                // White box must cover from above the text to below baseline
                const left = (orig.x - 5) * zoom;
                const top = (orig.y - orig.fontSize * 1.2) * zoom;  // Start above text
                const width = Math.max(orig.width + 15, (edit.newText.length * orig.fontSize * 0.65) + 15);
                const height = orig.fontSize * 1.6;  // Cover full text height + some padding

                return (
                  <div key={`edit_${edit.originalId}`} className="absolute pointer-events-none"
                    style={{
                      left,
                      top,
                      width: width * zoom,
                      height: height * zoom,
                      backgroundColor: 'white',
                      zIndex: 15,
                    }}>
                    {/* Text inside the white box */}
                    <span style={{
                      position: 'absolute',
                      left: 5 * zoom,
                      top: (orig.fontSize * 0.15) * zoom,
                      fontSize: orig.fontSize * zoom,
                      color: edit.isDeleted ? 'transparent' : '#000',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.1,
                    }}>
                      {edit.isDeleted ? '' : edit.newText}
                    </span>
                  </div>
                );
              })}

              {/* New text annotations */}
              {annotations.filter(a => a.type === 'text' && a.page === currentPage).map(a => {
                if (a.type !== 'text') return null;
                const styled = a as AnnotationWithStyle;
                return (
                  <div key={a.id} className="absolute pointer-events-none"
                    style={{
                      left: a.x * zoom, top: (pageDimensions.height - a.y) * zoom,
                      fontSize: a.fontSize * zoom, color: rgbToHex(a.color),
                      fontFamily: styled.fontFamily || activeFont,
                      fontWeight: styled.isBold ? 'bold' : 'normal',
                      fontStyle: styled.isItalic ? 'italic' : 'normal',
                      whiteSpace: 'nowrap',
                    }}>
                    {a.text}
                  </div>
                );
              })}

              {/* New text position marker */}
              {newTextPosition && (
                <div className="absolute w-0.5 h-4 bg-purple-600 animate-pulse" style={{ left: newTextPosition.x * zoom, top: newTextPosition.y * zoom }} />
              )}

              {/* Add text mode hint */}
              {addTextMode && !newTextPosition && (
                <div className="absolute inset-0 bg-purple-500/5 flex items-center justify-center pointer-events-none">
                  <span className="bg-white px-3 py-1 rounded shadow text-sm text-gray-600">Click where you want to add text</span>
                </div>
              )}
            </div>

            {/* Loading */}
            {isRendering && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-gray-600">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-600">
          <span>{textEdits.size} edits</span>
          <span>•</span>
          <span>{annotations.length} annotations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
          {totalPages > 1 && (
            <>
              <button onClick={() => onPageChange?.(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                className="px-2 py-0.5 hover:bg-gray-100 rounded disabled:opacity-30">←</button>
              <button onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                className="px-2 py-0.5 hover:bg-gray-100 rounded disabled:opacity-30">→</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdvancedPdfEditor;
