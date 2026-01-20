import { ToolPageMeta } from '@/types/tool';

/**
 * SEO configuration for all tool pages
 * Meta titles: 55-60 characters
 * Meta descriptions: 150-160 characters
 */
export const TOOL_SEO: Record<string, ToolPageMeta> = {
  'pdf-to-word': {
    title: 'PDF to Word Converter - Free Online Tool | AdobeWork',
    description: 'Convert PDF to Word documents online for free. Fast, secure PDF to DOCX conversion with preserved formatting. No watermarks, no registration required.',
    keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word', 'free pdf converter', 'pdf to word online', 'pdf converter', 'edit pdf'],
    h1: 'Convert PDF to Word Online Free',
    faqs: [
      {
        question: 'How do I convert PDF to Word for free?',
        answer: 'Simply upload your PDF file to AdobeWork, click Convert, and download your Word document. No registration or payment required. The entire process takes just seconds.',
      },
      {
        question: 'Will my PDF formatting be preserved?',
        answer: 'Yes, AdobeWork preserves text formatting, paragraph structure, and layout when converting PDF to Word documents. The converter analyzes the PDF structure to maintain the original document organization.',
      },
      {
        question: 'Is there a file size limit?',
        answer: 'Free users can convert PDF files up to 50MB. This is sufficient for most documents including reports, contracts, and presentations. Premium users enjoy larger file size limits.',
      },
      {
        question: 'Is my PDF file secure?',
        answer: 'Absolutely. All uploaded files are encrypted during transfer and automatically deleted from our servers within 1 hour. We never store or share your documents with third parties.',
      },
      {
        question: 'Can I convert scanned PDFs to Word?',
        answer: 'AdobeWork works best with text-based PDFs (created from digital documents). Scanned PDFs may require OCR (Optical Character Recognition) processing first for best results.',
      },
      {
        question: 'What Word format is the output?',
        answer: 'AdobeWork generates DOCX files, which are compatible with Microsoft Word 2007 and later, Google Docs, LibreOffice Writer, Apple Pages, and most modern word processors.',
      },
      {
        question: 'Do I need to install any software?',
        answer: 'No, AdobeWork is a completely online tool. You can convert PDF to Word directly in your web browser without installing any software or plugins.',
      },
      {
        question: 'Can I edit the converted Word document?',
        answer: 'Yes, the converted DOCX file is fully editable. You can modify text, change formatting, add or remove content, and use all standard word processing features.',
      },
    ],
  },
  'word-to-pdf': {
    title: 'Word to PDF Converter - Free Online DOCX Tool | AdobeWork',
    description: 'Convert Word documents to PDF online for free. Fast DOCX to PDF conversion with perfect formatting preserved. Secure processing, no watermarks, instant download.',
    keywords: ['word to pdf', 'docx to pdf', 'convert word to pdf', 'free word converter', 'doc to pdf online'],
    h1: 'Convert Word to PDF Online Free',
    faqs: [
      {
        question: 'How do I convert Word to PDF?',
        answer: 'Upload your Word document (.docx or .doc), click Convert, and download your PDF instantly. No software installation needed.',
      },
      {
        question: 'Does the conversion preserve formatting?',
        answer: 'Yes, AdobeWork maintains all formatting, fonts, images, and layout from your original Word document.',
      },
      {
        question: 'Can I convert multiple Word files at once?',
        answer: 'Currently, you can convert one Word document at a time. Use our Merge PDF tool to combine multiple PDFs afterward.',
      },
      {
        question: 'What Word formats are supported?',
        answer: 'AdobeWork supports both .docx and .doc file formats for conversion to PDF.',
      },
    ],
  },

  'image-to-pdf': {
    title: 'Image to PDF Converter - JPG PNG to PDF Free | AdobeWork',
    description: 'Convert JPG and PNG images to PDF online for free. Combine multiple images into one PDF document easily. Fast, secure, and simple to use image converter.',
    keywords: ['image to pdf', 'jpg to pdf', 'png to pdf', 'convert image to pdf', 'photo to pdf online'],
    h1: 'Convert Images to PDF Online Free',
    faqs: [
      {
        question: 'How do I convert images to PDF?',
        answer: 'Upload your JPG or PNG images, arrange them in your preferred order, and click Convert to create a PDF document.',
      },
      {
        question: 'Can I combine multiple images into one PDF?',
        answer: 'Yes, you can upload up to 20 images and combine them into a single PDF document.',
      },
      {
        question: 'What image formats are supported?',
        answer: 'AdobeWork supports JPG, JPEG, and PNG image formats for conversion to PDF.',
      },
      {
        question: 'Will image quality be preserved?',
        answer: 'Yes, your images are embedded in the PDF at their original quality without compression.',
      },
    ],
  },
  'merge-pdf': {
    title: 'Merge PDF Files - Combine Multiple PDFs Free | AdobeWork',
    description: 'Merge multiple PDF files into one document online for free. Drag and drop to reorder pages easily. Fast, secure PDF combiner tool with no watermarks.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf merger online', 'merge pdf free'],
    h1: 'Merge PDF Files Online Free',
    faqs: [
      {
        question: 'How do I merge PDF files?',
        answer: 'Upload your PDF files, drag to reorder them, and click Merge. Download your combined PDF instantly.',
      },
      {
        question: 'How many PDFs can I merge at once?',
        answer: 'You can merge up to 20 PDF files at once with AdobeWork free version.',
      },
      {
        question: 'Can I reorder pages before merging?',
        answer: 'Yes, simply drag and drop files to arrange them in your preferred order before merging.',
      },
      {
        question: 'Is the merged PDF quality affected?',
        answer: 'No, AdobeWork preserves the original quality of all pages when merging PDF documents.',
      },
    ],
  },

  'compress-pdf': {
    title: 'Compress PDF - Reduce PDF File Size Online Free | AdobeWork',
    description: 'Compress PDF files online for free. Reduce PDF size while maintaining quality for documents. Fast, secure compression perfect for email and file sharing.',
    keywords: ['compress pdf', 'reduce pdf size', 'pdf compressor', 'shrink pdf', 'compress pdf online free'],
    h1: 'Compress PDF Files Online Free',
    faqs: [
      {
        question: 'How do I compress a PDF file?',
        answer: 'Upload your PDF, select compression level, and click Compress. Download your smaller PDF file instantly.',
      },
      {
        question: 'How much can I reduce the file size?',
        answer: 'Compression results vary based on content. PDFs with images typically see 50-80% size reduction.',
      },
      {
        question: 'Will compression affect PDF quality?',
        answer: 'AdobeWork balances file size and quality. Text remains sharp while images are optimized.',
      },
      {
        question: 'What is the maximum file size for compression?',
        answer: 'Free users can compress PDF files up to 100MB. Premium users enjoy higher limits.',
      },
    ],
  },
  'pdf-to-ppt': {
    title: 'PDF to PowerPoint Converter - Free Online Tool | AdobeWork',
    description: 'Convert PDF to PowerPoint presentations online for free. Transform PDF files to editable PPTX slides easily. Fast, secure processing, no registration needed.',
    keywords: ['pdf to ppt', 'pdf to powerpoint', 'convert pdf to pptx', 'pdf to slides', 'pdf to presentation'],
    h1: 'Convert PDF to PowerPoint Online Free',
    faqs: [
      {
        question: 'How do I convert PDF to PowerPoint?',
        answer: 'Upload your PDF file, click Convert, and download your editable PowerPoint presentation.',
      },
      {
        question: 'Will my PDF content be editable in PowerPoint?',
        answer: 'Yes, text and images from your PDF become editable elements in the PowerPoint slides.',
      },
      {
        question: 'How are PDF pages converted to slides?',
        answer: 'Each PDF page is converted to a separate PowerPoint slide, preserving layout and content.',
      },
      {
        question: 'What PowerPoint format is generated?',
        answer: 'AdobeWork generates .pptx files compatible with Microsoft PowerPoint and Google Slides.',
      },
    ],
  },

  'ppt-to-pdf': {
    title: 'PowerPoint to PDF Converter - Free Online Tool | AdobeWork',
    description: 'Convert PowerPoint to PDF online for free. Transform PPTX presentations to PDF format easily. Preserve formatting, fast conversion, no watermarks added.',
    keywords: ['ppt to pdf', 'powerpoint to pdf', 'convert pptx to pdf', 'presentation to pdf', 'slides to pdf'],
    h1: 'Convert PowerPoint to PDF Online Free',
    faqs: [
      {
        question: 'How do I convert PowerPoint to PDF?',
        answer: 'Upload your PowerPoint file (.pptx or .ppt), click Convert, and download your PDF instantly.',
      },
      {
        question: 'Are animations preserved in the PDF?',
        answer: 'PDF is a static format, so animations are not preserved. Each slide becomes a PDF page.',
      },
      {
        question: 'Will fonts and formatting be preserved?',
        answer: 'Yes, AdobeWork preserves fonts, colors, images, and layout from your presentation.',
      },
      {
        question: 'Can I convert presentations with embedded videos?',
        answer: 'Videos cannot be embedded in PDF. The video placeholder will appear as an image.',
      },
    ],
  },
  'pdf-to-excel': {
    title: 'PDF to Excel Converter - Extract Tables Online Free | AdobeWork',
    description: 'Convert PDF tables to Excel spreadsheets online for free. Extract data from PDF to XLSX format easily. Accurate table detection with fast conversion.',
    keywords: ['pdf to excel', 'pdf to xlsx', 'extract pdf tables', 'convert pdf to spreadsheet', 'pdf table extractor'],
    h1: 'Convert PDF to Excel Online Free',
    faqs: [
      {
        question: 'How do I convert PDF to Excel?',
        answer: 'Upload your PDF containing tables, click Convert, and download your Excel spreadsheet.',
      },
      {
        question: 'Does it work with scanned PDFs?',
        answer: 'AdobeWork works best with text-based PDFs. Scanned documents may require OCR processing.',
      },
      {
        question: 'How accurate is the table extraction?',
        answer: 'AdobeWork uses advanced algorithms to detect and extract tables with high accuracy.',
      },
      {
        question: 'Can I convert PDFs with multiple tables?',
        answer: 'Yes, all tables in your PDF will be extracted to separate sheets in the Excel file.',
      },
    ],
  },

  'excel-to-pdf': {
    title: 'Excel to PDF Converter - Free Online XLSX Tool | AdobeWork',
    description: 'Convert Excel spreadsheets to PDF online for free. Transform XLSX files to PDF format with perfect formatting preserved. Fast, secure, no watermarks.',
    keywords: ['excel to pdf', 'xlsx to pdf', 'convert spreadsheet to pdf', 'excel converter', 'spreadsheet to pdf'],
    h1: 'Convert Excel to PDF Online Free',
    faqs: [
      {
        question: 'How do I convert Excel to PDF?',
        answer: 'Upload your Excel file (.xlsx or .xls), click Convert, and download your PDF document.',
      },
      {
        question: 'Are formulas preserved in the PDF?',
        answer: 'PDF shows the calculated values. Formulas are not preserved as PDF is not editable.',
      },
      {
        question: 'How are multiple sheets handled?',
        answer: 'Each Excel sheet is converted to separate pages in the resulting PDF document.',
      },
      {
        question: 'Will cell formatting be preserved?',
        answer: 'Yes, AdobeWork preserves cell colors, borders, fonts, and formatting in the PDF.',
      },
    ],
  },
  'split-pdf': {
    title: 'Split PDF - Extract Pages from PDF Online Free | AdobeWork',
    description: 'Split PDF files online for free. Extract specific pages or divide PDF into separate documents easily. Fast, secure PDF splitter tool with no watermarks.',
    keywords: ['split pdf', 'extract pdf pages', 'divide pdf', 'pdf splitter', 'separate pdf pages'],
    h1: 'Split PDF Files Online Free',
    faqs: [
      {
        question: 'How do I split a PDF file?',
        answer: 'Upload your PDF, select the pages you want to extract, and click Split. Download your new PDF.',
      },
      {
        question: 'Can I extract specific page ranges?',
        answer: 'Yes, you can select individual pages or specify page ranges like 1-5, 8, 10-15.',
      },
      {
        question: 'Can I split a PDF into individual pages?',
        answer: 'Yes, AdobeWork can split your PDF into separate single-page documents.',
      },
      {
        question: 'Is the original PDF quality preserved?',
        answer: 'Yes, extracted pages maintain the exact same quality as the original PDF.',
      },
    ],
  },

  'reorder-pdf': {
    title: 'Reorder PDF Pages - Rearrange PDF Online Free | AdobeWork',
    description: 'Reorder PDF pages online for free. Drag and drop to rearrange pages in any order you want. Fast, secure PDF page organizer tool with no watermarks.',
    keywords: ['reorder pdf', 'rearrange pdf pages', 'organize pdf', 'pdf page order', 'sort pdf pages'],
    h1: 'Reorder PDF Pages Online Free',
    faqs: [
      {
        question: 'How do I reorder PDF pages?',
        answer: 'Upload your PDF, drag and drop pages to rearrange them, and click Save. Download your reorganized PDF.',
      },
      {
        question: 'Can I delete pages while reordering?',
        answer: 'Yes, you can remove unwanted pages while rearranging your PDF document.',
      },
      {
        question: 'Is there a page limit for reordering?',
        answer: 'Free users can reorder PDFs up to 100 pages. Premium users enjoy unlimited pages.',
      },
      {
        question: 'Will reordering affect PDF quality?',
        answer: 'No, reordering only changes page sequence. All content quality remains unchanged.',
      },
    ],
  },
  'rotate-pdf': {
    title: 'Rotate PDF Pages - Free Online Rotation Tool | AdobeWork',
    description: 'Rotate PDF pages online for free. Turn pages 90, 180, or 270 degrees easily. Fix upside-down or sideways PDFs instantly with fast and secure processing.',
    keywords: ['rotate pdf', 'turn pdf pages', 'flip pdf', 'rotate pdf online', 'pdf rotation tool'],
    h1: 'Rotate PDF Pages Online Free',
    faqs: [
      {
        question: 'How do I rotate PDF pages?',
        answer: 'Upload your PDF, select pages to rotate, choose rotation angle (90°, 180°, 270°), and click Rotate.',
      },
      {
        question: 'Can I rotate individual pages?',
        answer: 'Yes, you can rotate specific pages or all pages at once in your PDF document.',
      },
      {
        question: 'What rotation angles are available?',
        answer: 'AdobeWork supports 90° (clockwise), 180° (flip), and 270° (counter-clockwise) rotation.',
      },
      {
        question: 'Will rotation affect PDF quality?',
        answer: 'No, rotation only changes page orientation. All content and quality remain intact.',
      },
    ],
  },

  'protect-pdf': {
    title: 'Protect PDF - Add Password Protection Free | AdobeWork',
    description: 'Add password protection to PDF files online for free. Secure your documents with strong encryption. Fast, easy-to-use PDF password protection tool.',
    keywords: ['protect pdf', 'password protect pdf', 'encrypt pdf', 'secure pdf', 'lock pdf file'],
    h1: 'Protect PDF with Password Online Free',
    faqs: [
      {
        question: 'How do I password protect a PDF?',
        answer: 'Upload your PDF, enter your desired password, and click Protect. Download your secured PDF.',
      },
      {
        question: 'What encryption is used?',
        answer: 'AdobeWork uses AES-256 encryption to secure your PDF documents.',
      },
      {
        question: 'Can I set different permissions?',
        answer: 'Yes, you can restrict printing, copying, and editing while allowing viewing.',
      },
      {
        question: 'What if I forget the password?',
        answer: 'Passwords cannot be recovered. Make sure to save your password in a secure location.',
      },
    ],
  },
  'unlock-pdf': {
    title: 'Unlock PDF - Remove Password Protection Free | AdobeWork',
    description: 'Remove password protection from PDF files online for free. Unlock secured PDFs with valid password easily. Fast, secure PDF unlocker tool for documents.',
    keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf', 'unsecure pdf', 'pdf password remover'],
    h1: 'Unlock PDF Files Online Free',
    faqs: [
      {
        question: 'How do I unlock a PDF?',
        answer: 'Upload your protected PDF, enter the correct password, and click Unlock. Download your unlocked PDF.',
      },
      {
        question: 'Can I unlock a PDF without the password?',
        answer: 'No, you must provide the correct password to unlock a protected PDF document.',
      },
      {
        question: 'Will unlocking remove all restrictions?',
        answer: 'Yes, the unlocked PDF will have no password or permission restrictions.',
      },
      {
        question: 'Is my password secure?',
        answer: 'Yes, passwords are processed securely and never stored on our servers.',
      },
    ],
  },

  'watermark-pdf': {
    title: 'Watermark PDF - Add Watermark to PDF Online Free | AdobeWork',
    description: 'Add text or image watermarks to PDF files online for free. Customize position, opacity, and size easily. Fast, secure PDF watermarking tool for documents.',
    keywords: ['watermark pdf', 'add watermark to pdf', 'pdf watermark', 'stamp pdf', 'pdf branding'],
    h1: 'Add Watermark to PDF Online Free',
    faqs: [
      {
        question: 'How do I add a watermark to PDF?',
        answer: 'Upload your PDF, enter watermark text or upload an image, customize settings, and click Apply.',
      },
      {
        question: 'Can I use an image as a watermark?',
        answer: 'Yes, you can upload PNG or JPG images to use as watermarks on your PDF.',
      },
      {
        question: 'Can I customize watermark appearance?',
        answer: 'Yes, adjust position, size, rotation, opacity, and color of your watermark.',
      },
      {
        question: 'Will the watermark appear on all pages?',
        answer: 'Yes, by default watermarks are applied to all pages. You can select specific pages.',
      },
    ],
  },
  'sign-pdf': {
    title: 'Sign PDF - Add Electronic Signature Free | AdobeWork',
    description: 'Sign PDF documents online for free. Draw or upload your signature and place it anywhere on your PDF pages. Fast, secure electronic signing tool for all.',
    keywords: ['sign pdf', 'add signature to pdf', 'electronic signature', 'pdf signature', 'e-sign pdf'],
    h1: 'Sign PDF Documents Online Free',
    faqs: [
      {
        question: 'How do I sign a PDF online?',
        answer: 'Upload your PDF, draw your signature or upload an image, place it on the document, and download.',
      },
      {
        question: 'Is the electronic signature legally valid?',
        answer: 'Electronic signatures are legally recognized in many jurisdictions. Check local laws for specifics.',
      },
      {
        question: 'Can I save my signature for future use?',
        answer: 'Yes, you can save your signature locally in your browser for quick access.',
      },
      {
        question: 'Can I add multiple signatures?',
        answer: 'Yes, you can add multiple signatures and place them anywhere on your PDF pages.',
      },
    ],
  },

  'edit-pdf': {
    title: 'Edit PDF - Free Online PDF Editor and Annotator | AdobeWork',
    description: 'Edit PDF files online for free. Add text, highlight, draw, and annotate your documents easily. Easy-to-use PDF editor tool with no watermarks added.',
    keywords: ['edit pdf', 'pdf editor', 'annotate pdf', 'add text to pdf', 'pdf markup tool'],
    h1: 'Edit PDF Files Online Free',
    faqs: [
      {
        question: 'How do I edit a PDF online?',
        answer: 'Upload your PDF, use the toolbar to add text, highlight, or draw, then download your edited PDF.',
      },
      {
        question: 'Can I edit existing text in the PDF?',
        answer: 'AdobeWork allows adding new text and annotations. Editing existing text requires the original source.',
      },
      {
        question: 'What editing tools are available?',
        answer: 'Add text, highlight, underline, strikethrough, draw freehand, add shapes, and insert images.',
      },
      {
        question: 'Can I undo changes while editing?',
        answer: 'Yes, use the undo button or Ctrl+Z to reverse recent changes while editing.',
      },
    ],
  },

  // Image Tools SEO
  'resize-image': {
    title: 'Resize Image Online Free - Change Image Dimensions | AdobeWork',
    description: 'Resize images to any dimension online for free. Presets for Instagram, Facebook, passport photos, and more. Fast, secure image resizer with batch support.',
    keywords: ['resize image', 'image resizer', 'change image size', 'resize photo online', 'image dimensions'],
    h1: 'Resize Images Online Free',
    faqs: [
      {
        question: 'How do I resize an image?',
        answer: 'Upload your image, enter custom dimensions or select a preset (Instagram, Facebook, passport), and download your resized image.',
      },
      {
        question: 'Can I maintain aspect ratio while resizing?',
        answer: 'Yes, enable the aspect ratio lock to maintain proportions when changing one dimension.',
      },
      {
        question: 'What presets are available?',
        answer: 'AdobeWork offers presets for Instagram, Facebook, WhatsApp, passport photos, PAN card, Aadhaar, and more.',
      },
      {
        question: 'Can I resize multiple images at once?',
        answer: 'Yes, upload up to 20 images and resize them all to the same dimensions in batch mode.',
      },
    ],
  },
  'crop-rotate-image': {
    title: 'Crop & Rotate Image Online Free - Image Editor | AdobeWork',
    description: 'Crop and rotate images online for free. Preset aspect ratios, flip, straighten, and rotate tools. Fast, secure image cropping with no watermarks.',
    keywords: ['crop image', 'rotate image', 'flip image', 'image cropper', 'straighten photo'],
    h1: 'Crop & Rotate Images Online Free',
    faqs: [
      {
        question: 'How do I crop an image?',
        answer: 'Upload your image, select a crop area or choose a preset aspect ratio, and download your cropped image.',
      },
      {
        question: 'What aspect ratios are available?',
        answer: 'AdobeWork offers 1:1 (square), 4:5, 5:4, 16:9, 9:16, 3:2, and 2:3 aspect ratio presets.',
      },
      {
        question: 'Can I rotate images by any angle?',
        answer: 'Yes, use the straighten slider for fine adjustments (-45° to +45°) or quick rotate buttons for 90° and 180°.',
      },
      {
        question: 'Can I flip images horizontally or vertically?',
        answer: 'Yes, AdobeWork provides both horizontal and vertical flip options for your images.',
      },
    ],
  },
  'compress-image': {
    title: 'Compress Image Online Free - Reduce Image Size | AdobeWork',
    description: 'Compress images online for free. Reduce file size while maintaining quality. Smart compression, target size option, and batch processing available.',
    keywords: ['compress image', 'reduce image size', 'image compressor', 'optimize image', 'shrink photo'],
    h1: 'Compress Images Online Free',
    faqs: [
      {
        question: 'How do I compress an image?',
        answer: 'Upload your image, choose smart compression or set a quality level, and download your compressed image.',
      },
      {
        question: 'How much can I reduce the file size?',
        answer: 'Compression results vary, but most images can be reduced by 50-80% while maintaining good visual quality.',
      },
      {
        question: 'Can I set a target file size?',
        answer: 'Yes, specify a target size (e.g., under 100KB) and AdobeWork will optimize to meet that goal.',
      },
      {
        question: 'Will compression affect image quality?',
        answer: 'Smart compression balances size and quality. You can also manually adjust the quality slider for more control.',
      },
    ],
  },
  'convert-image': {
    title: 'Convert Image Format Online Free - JPG PNG WEBP | AdobeWork',
    description: 'Convert images between JPG, PNG, and WEBP formats online for free. HEIC to JPG conversion supported. Fast, secure format converter with batch processing.',
    keywords: ['convert image', 'jpg to png', 'png to jpg', 'webp converter', 'heic to jpg'],
    h1: 'Convert Image Format Online Free',
    faqs: [
      {
        question: 'What image formats can I convert?',
        answer: 'AdobeWork supports conversion between JPG, PNG, WEBP, and can convert HEIC to JPG or PNG.',
      },
      {
        question: 'Will transparency be preserved?',
        answer: 'Yes, when converting to PNG, transparency is preserved. JPG does not support transparency.',
      },
      {
        question: 'Can I convert multiple images at once?',
        answer: 'Yes, upload up to 20 images and convert them all to your chosen format in batch mode.',
      },
      {
        question: 'Can I adjust quality when converting?',
        answer: 'Yes, when converting to JPG or WEBP, you can adjust the quality level to balance size and quality.',
      },
    ],
  },
  'photo-editor': {
    title: 'Photo Editor Online Free - Adjust & Enhance Photos | AdobeWork',
    description: 'Edit photos online for free. Adjust brightness, contrast, saturation, and apply filters. Undo/redo support with real-time preview. No watermarks.',
    keywords: ['photo editor', 'edit photo online', 'image filters', 'adjust brightness', 'enhance photo'],
    h1: 'Edit Photos Online Free',
    faqs: [
      {
        question: 'What adjustments can I make?',
        answer: 'Adjust brightness, contrast, saturation, exposure, blur, and sharpness with easy-to-use sliders.',
      },
      {
        question: 'Are there filter presets available?',
        answer: 'Yes, AdobeWork offers presets like Vivid, Warm, Cool, Vintage, Black & White, and Dramatic.',
      },
      {
        question: 'Can I undo changes?',
        answer: 'Yes, AdobeWork maintains edit history for at least 20 operations with full undo/redo support.',
      },
      {
        question: 'Is there a real-time preview?',
        answer: 'Yes, all adjustments are shown in real-time so you can see the effect before downloading.',
      },
    ],
  },
  'add-text-sticker': {
    title: 'Add Text & Stickers to Image Online Free | AdobeWork',
    description: 'Add text, emojis, and stickers to images online for free. Customizable fonts, colors, and effects. Create graphics and annotate images easily with no watermarks.',
    keywords: ['add text to image', 'image stickers', 'photo text editor', 'add emoji to photo', 'image annotation'],
    h1: 'Add Text & Stickers to Images Free',
    faqs: [
      {
        question: 'How do I add text to an image?',
        answer: 'Upload your image, click Add Text, type your text, customize font and color, then position it on the image.',
      },
      {
        question: 'Can I customize the text appearance?',
        answer: 'Yes, choose from various fonts, colors, sizes, and add effects like shadow and outline.',
      },
      {
        question: 'What stickers are available?',
        answer: 'AdobeWork offers emojis and a variety of stickers that you can resize and position anywhere on your image.',
      },
      {
        question: 'Can I add multiple text layers?',
        answer: 'Yes, add as many text and sticker layers as you need, each independently movable and resizable.',
      },
    ],
  },
  'remove-background': {
    title: 'Remove Background from Image Online Free - AI Tool | AdobeWork',
    description: 'Remove image backgrounds online for free with AI. Replace with transparent, solid color, or custom background. Fast, accurate background removal.',
    keywords: ['remove background', 'background remover', 'transparent background', 'remove bg', 'ai background removal'],
    h1: 'Remove Image Background Online Free',
    faqs: [
      {
        question: 'How does background removal work?',
        answer: 'Upload your image and our AI automatically detects and removes the background, leaving the subject intact.',
      },
      {
        question: 'Can I replace the background?',
        answer: 'Yes, choose transparent, solid color, gradient, or upload a custom background image.',
      },
      {
        question: 'Is the edge detection accurate?',
        answer: 'Our AI provides accurate edge detection including hair and fine details. Manual refinement is also available.',
      },
      {
        question: 'What output format is available?',
        answer: 'Download as PNG with transparency, or with your chosen background in JPG or PNG format.',
      },
    ],
  },
  'upscale-image': {
    title: 'Upscale Image Online Free - AI Image Enhancer | AdobeWork',
    description: 'Upscale and enhance images online for free with AI. Increase resolution by 2x or 4x while improving quality. Fast, secure AI-powered image upscaling tool.',
    keywords: ['upscale image', 'image enhancer', 'increase resolution', 'ai upscaler', 'enhance photo quality'],
    h1: 'Upscale Images Online Free',
    faqs: [
      {
        question: 'How does AI upscaling work?',
        answer: 'Our AI analyzes your image and intelligently adds detail while increasing resolution by 2x or 4x.',
      },
      {
        question: 'What scale options are available?',
        answer: 'Choose between 2x (double) or 4x (quadruple) the original resolution.',
      },
      {
        question: 'Will upscaling improve image quality?',
        answer: 'Yes, AI upscaling enhances details and reduces artifacts, resulting in sharper, clearer images.',
      },
      {
        question: 'What is the maximum input size?',
        answer: 'For best results, input images should be up to 2000×2000 pixels.',
      },
    ],
  },
  'passport-photo': {
    title: 'Passport Photo Maker Online Free - ID Photo Generator | AdobeWork',
    description: 'Create passport-compliant photos online for free. Auto face detection, background replacement, and presets for Indian passport, PAN, Aadhaar, US visa.',
    keywords: ['passport photo', 'id photo maker', 'passport photo online', 'pan card photo', 'aadhaar photo'],
    h1: 'Create Passport Photos Online Free',
    faqs: [
      {
        question: 'How do I create a passport photo?',
        answer: 'Upload your photo, select a preset (passport, PAN, Aadhaar), and our AI will auto-crop and adjust the background.',
      },
      {
        question: 'What photo specifications are supported?',
        answer: 'AdobeWork supports Indian passport, PAN card, Aadhaar, US visa, and other common ID photo specifications.',
      },
      {
        question: 'Will the background be replaced?',
        answer: 'Yes, the AI automatically replaces the background with white or light blue as required for official photos.',
      },
      {
        question: 'Can I print the passport photos?',
        answer: 'Yes, AdobeWork generates a print-ready layout with multiple copies for standard photo paper sizes.',
      },
    ],
  },
};

/**
 * Get SEO configuration for a tool by slug
 */
export function getToolSEO(slug: string): ToolPageMeta | undefined {
  return TOOL_SEO[slug];
}

/**
 * Get all tool slugs with SEO configuration
 */
export function getAllToolSlugs(): string[] {
  return Object.keys(TOOL_SEO);
}
