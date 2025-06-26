import { ComprehensiveScraper, ComprehensiveProduct, StoreLocation } from './types';

export class NestersComprehensiveScraper implements ComprehensiveScraper {
  private readonly baseUrl = 'https://www.nestersmarket.com';
  private readonly apiUrl = 'https://www.nestersmarket.com/api';
  
  getStoreName(): string {
    return 'nesters';
  }

  async getStoreLocations(): Promise<StoreLocation[]> {
    try {
      const response = await fetch(`${this.apiUrl}/stores`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch Nesters Market store locations');
        return [];
      }

      const data = await response.json();
      
      return data.locations?.map((store: any) => ({
        locationId: store.id || store.storeId,
        name: store.name || `Nesters Market ${store.city}`,
        address: store.address,
        city: store.city,
        province: store.province || 'BC',
        postalCode: store.postalCode,
        phone: store.phone,
        hours: store.hours,
        services: store.services || []
      })) || [];
    } catch (error) {
      console.error('Error fetching Nesters Market store locations:', error);
      return [];
    }
  }

  async scrapeFullCatalog(locationId: string = '2001'): Promise<ComprehensiveProduct[]> {
    const categories = [
      'fresh-produce', 'meat-poultry', 'seafood', 'deli-prepared',
      'bakery-fresh', 'dairy-refrigerated', 'frozen-foods',
      'pantry-staples', 'beverages', 'snacks-confectionery',
      'health-wellness', 'household-essentials', 'baby-care', 'pet-supplies'
    ];

    const allProducts: ComprehensiveProduct[] = [];
    
    for (const category of categories) {
      try {
        console.log(`Scraping Nesters Market category: ${category}`);
        const categoryProducts = await this.scrapeCategory(category, locationId);
        allProducts.push(...categoryProducts);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping category ${category}:`, error);
      }
    }

    console.log(`Nesters Market: Scraped ${allProducts.length} total products`);
    return allProducts;
  }

  async scrapeCategory(category: string, locationId: string = '2001'): Promise<ComprehensiveProduct[]> {
    const products: ComprehensiveProduct[] = [];
    let page = 1;
    const perPage = 100;
    
    try {
      while (true) {
        const url = `${this.apiUrl}/stores/${locationId}/products/${category}?page=${page}&per_page=${perPage}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        });

        if (!response.ok) {
          console.log(`No more products in category ${category} at page ${page}`);
          break;
        }

        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
          break;
        }

        for (const item of data.items) {
          try {
            const product = await this.parseProduct(item, category, locationId);
            if (product) {
              products.push(product);
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        }

        page++;
        
        if (page > 200) {
          console.warn(`Reached page limit for category ${category}`);
          break;
        }
      }
    } catch (error) {
      console.error(`Error scraping Nesters Market category ${category}:`, error);
    }

    return products;
  }

  private async parseProduct(item: any, category: string, locationId: string): Promise<ComprehensiveProduct | null> {
    try {
      const sku = item.barcode || item.upc || item.sku || item.id?.toString();
      if (!sku) return null;

      const regularPrice = parseFloat(item.price || item.regularPrice || item.basePrice);
      const salePrice = item.specialPrice || item.salePrice;
      
      return {
        sku,
        name: item.name || item.productName,
        brand: item.brand || item.brandName,
        store: this.getStoreName(),
        storeLocation: locationId,
        category: this.standardizeCategory(category),
        subcategory: item.subCategory,
        description: item.description || item.longDescription,
        
        size: item.size || item.packageSize || item.weight || '1',
        unit: this.determineUnit(item),
        sizePer100g: this.calculateSizePer100g(item.size, item.unit),
        
        regularPrice,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        priceStatus: salePrice ? 'on_sale' : 'regular',
        pricePerUnit: this.calculatePricePerUnit(regularPrice, item.size, item.unit),
        
        countryOfOrigin: item.origin || item.countryOfOrigin,
        ingredients: item.ingredients,
        nutritionInfo: item.nutrition || item.nutritionalInfo,
        allergens: item.allergens || [],
        
        inStock: item.available !== false && item.inStock !== false,
        availability: this.mapAvailability(item.stockStatus),
        
        imageUrl: item.imageUrl || item.image || item.photo,
        productUrl: `${this.baseUrl}/product/${this.slugify(item.name)}/${sku}`
      };
    } catch (error) {
      console.error('Error parsing Nesters Market product:', error);
      return null;
    }
  }

  private standardizeCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'fresh-produce': 'Fruits & Vegetables',
      'meat-poultry': 'Meat & Seafood',
      'seafood': 'Meat & Seafood',
      'deli-prepared': 'Deli & Prepared Foods',
      'bakery-fresh': 'Bakery',
      'dairy-refrigerated': 'Dairy & Eggs',
      'frozen-foods': 'Frozen Foods',
      'pantry-staples': 'Pantry & Dry Goods',
      'beverages': 'Beverages',
      'snacks-confectionery': 'Snacks & Candy',
      'health-wellness': 'Health & Beauty',
      'household-essentials': 'Household & Cleaning',
      'baby-care': 'Baby & Kids',
      'pet-supplies': 'Pet Care'
    };
    
    return categoryMap[category] || category;
  }

  private determineUnit(item: any): string {
    if (item.unit) return item.unit;
    if (item.size && typeof item.size === 'string') {
      if (item.size.match(/\d+\s*(g|kg|ml|l|oz|lb)/i)) {
        return 'per_100g';
      }
    }
    return 'per_item';
  }

  private calculateSizePer100g(size: string, unit: string): number | undefined {
    if (!size || unit !== 'per_100g') return undefined;
    
    const match = size.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb)/i);
    if (!match) return undefined;
    
    const amount = parseFloat(match[1]);
    const unitType = match[2].toLowerCase();
    
    switch (unitType) {
      case 'kg': return amount * 1000 / 100;
      case 'g': return amount / 100;
      case 'l': return amount * 1000 / 100;
      case 'ml': return amount / 100;
      case 'oz': return amount * 28.35 / 100;
      case 'lb': return amount * 453.592 / 100;
      default: return undefined;
    }
  }

  private calculatePricePerUnit(price: number, size: string, unit: string): number | undefined {
    const sizePer100g = this.calculateSizePer100g(size, unit);
    if (!sizePer100g) return undefined;
    return price / sizePer100g;
  }

  private mapAvailability(stockStatus: string): 'in_stock' | 'low_stock' | 'out_of_stock' | undefined {
    if (!stockStatus) return 'in_stock';
    
    const lower = stockStatus.toLowerCase();
    if (lower.includes('out') || lower.includes('unavailable')) return 'out_of_stock';
    if (lower.includes('low') || lower.includes('limited')) return 'low_stock';
    return 'in_stock';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
} 