// Tool-related type definitions
// Will be implemented in Task 2

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  category: 'core' | 'advanced' | 'image';
  acceptedFormats: string[];
  outputFormat: string;
  maxFileSize: number;
  maxFiles: number;
  processingLocation: 'client' | 'server';
}

export interface ToolPageMeta {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  faqs: FAQ[];
}

export interface FAQ {
  question: string;
  answer: string;
}
