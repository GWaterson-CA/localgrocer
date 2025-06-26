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

export interface ComprehensiveProduct {
  sku: string;
  name: string;
  brand?: string;
  store: string;
  storeLocation: string;
  category: string;
  subcategory?: string;
  description?: string;
  
  // Size and unit information
  size: string;
  unit: string;
  sizePer100g?: number;
  
  // Pricing information
  regularPrice: number;
  salePrice?: number;
  priceStatus: 'regular' | 'on_sale';
  pricePerUnit?: number;
  
  // Product details
  countryOfOrigin?: string;
  ingredients?: string;
  nutritionInfo?: any;
  allergens?: string[];
  
  // Availability
  inStock: boolean;
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
  
  // Media
  imageUrl?: string;
  productUrl?: string;
}

export interface Scraper {
  getStoreName(): string;
  scrape(): Promise<ScrapedItem[]>;
}

export interface ComprehensiveScraper {
  getStoreName(): string;
  getStoreLocations(): Promise<StoreLocation[]>;
  scrapeFullCatalog(locationId?: string): Promise<ComprehensiveProduct[]>;
  scrapeCategory(category: string, locationId?: string): Promise<ComprehensiveProduct[]>;
}

export interface StoreLocation {
  locationId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string;
  hours?: any;
  services?: string[];
}

// Normalized unit types
export type NormalizedUnit = 'per_100g' | 'per_item';

export interface NormalizedPrice {
  price: number;
  unit: NormalizedUnit;
  originalUnit: string;
  originalSize: string;
} 