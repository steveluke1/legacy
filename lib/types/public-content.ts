export interface PublicHighlight {
  title: string;
  description: string;
}

export interface PublicContentRecord {
  heroTitle: string;
  heroSubtitle: string;
  highlights: PublicHighlight[];
}