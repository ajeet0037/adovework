// SEO-related type definitions
// Will be implemented in Task 2

export interface OpenGraphMeta {
  title: string;
  description: string;
  url: string;
  siteName: string;
  type: string;
  images?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  }[];
}

export interface PageSEO {
  title: string;
  description: string;
  canonical: string;
  openGraph: OpenGraphMeta;
  jsonLd: object;
}
