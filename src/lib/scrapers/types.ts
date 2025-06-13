export interface ScrapedItem {
  sku: string;
  name: string;
  store: string;
  unit: string;
  size: string | number;
  regularPrice: number; // everyday shelf price, >=0
  salePrice: number | null; // flyer price or null if none
  saleEnds?: Date;
}

export interface Scraper {
  getStoreName(): string;
  scrape(): Promise<ScrapedItem[]>;
}

// Normalized unit types
export type NormalizedUnit = 'per_100g' | 'per_item';

export interface NormalizedPrice {
  price: number;
  unit: NormalizedUnit;
  originalUnit: string;
  originalSize: string;
} 