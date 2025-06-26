import { ComprehensiveScraper, ComprehensiveProduct, StoreLocation } from './types';

export class SaveOnComprehensiveScraper implements ComprehensiveScraper {
  private readonly baseUrl = 'https://www.saveonfoods.com';
  private readonly apiUrl = 'https://storefrontgateway.saveonfoods.com/api';
  
  getStoreName(): string {
    return 'saveon';
  }

  async getStoreLocations(): Promise<StoreLocation[]> {
    try {
      // Save-On-Foods store locator API
      const response = await fetch(`${this.apiUrl}/stores`, {
        headers: {
          'Accept': 'application/json',
          'X-Site-Host': 'https://www.saveonfoods.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch Save-On-Foods store locations');
        return [];
      }

      const data = await response.json();
      
      return data.stores?.map((store: any) => ({
        locationId: store.id || store.storeId,
        name: store.name || store.displayName,
        address: store.address?.street || store.address,
        city: store.address?.city || store.city,
        province: store.address?.province || store.province,
        postalCode: store.address?.postalCode || store.postalCode,
        phone: store.phone,
        hours: store.hours,
        services: store.services || []
      })) || [];
    } catch (error) {
      console.error('Error fetching Save-On-Foods store locations:', error);
      return [];
    }
  }

  async scrapeFullCatalog(locationId: string = '3000'): Promise<ComprehensiveProduct[]> {
    const categories = [
      'fresh-produce', 'meat-seafood', 'deli-prepared-foods', 'bakery',
      'dairy-eggs', 'pantry', 'frozen', 'beverages', 'snacks-candy',
      'health-beauty', 'household-cleaning', 'baby-kids', 'pet-care'
    ];

    const allProducts: ComprehensiveProduct[] = [];
    
    for (const category of categories) {
      try {
        console.log(`Scraping Save-On-Foods category: ${category}`);
        const categoryProducts = await this.scrapeCategory(category, locationId);
        allProducts.push(...categoryProducts);
        
        // Add delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping category ${category}:`, error);
      }
    }

    console.log(`Save-On-Foods: Scraped ${allProducts.length} total products`);
    return allProducts;
  }

  async scrapeCategory(category: string, locationId: string = '3000'): Promise<ComprehensiveProduct[]> {
    const products: ComprehensiveProduct[] = [];
    let page = 0;
    const pageSize = 100;
    
    try {
      while (true) {
        const url = `${this.apiUrl}/stores/${locationId}/preview?popularTake=30&q=&categoryId=${this.mapCategoryToId(category)}&skip=${page * pageSize}&take=${pageSize}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'X-Correlation-Id': this.generateCorrelationId(),
            'X-Shopping-Mode': '11111111-1111-1111-1111-111111111111',
            'X-Site-Host': 'https://www.saveonfoods.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://www.saveonfoods.com'
          }
        });

        if (!response.ok) {
          console.log(`No more products in category ${category} at page ${page}`);
          break;
        }

        const data = await response.json();
        
        if (!data.products || data.products.length === 0) {
          break;
        }

        for (const item of data.products) {
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
        
        // Prevent infinite loops
        if (page > 100) {
          console.warn(`Reached page limit for category ${category}`);
          break;
        }
      }
    } catch (error) {
      console.error(`Error scraping Save-On-Foods category ${category}:`, error);
    }

    return products;
  }

  private async parseProduct(item: any, category: string, locationId: string): Promise<ComprehensiveProduct | null> {
    try {
      const sku = item.upc || item.sku || item.id?.toString();
      if (!sku) return null;

      const regularPrice = parseFloat(item.price?.regular || item.regularPrice || item.price);
      const salePrice = item.price?.sale || item.salePrice;
      
      // Get detailed product information
      const productDetails = await this.getProductDetails(sku, locationId);
      
      return {
        sku,
        name: item.name || item.displayName,
        brand: item.brand || productDetails?.brand,
        store: this.getStoreName(),
        storeLocation: locationId,
        category: this.standardizeCategory(category),
        subcategory: item.subcategory || productDetails?.subcategory,
        description: item.description || productDetails?.description,
        
        size: item.size || item.packageSize || '1',
        unit: this.determineUnit(item),
        sizePer100g: this.calculateSizePer100g(item.size, item.unit),
        
        regularPrice,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        priceStatus: salePrice ? 'on_sale' : 'regular',
        pricePerUnit: this.calculatePricePerUnit(regularPrice, item.size, item.unit),
        
        countryOfOrigin: productDetails?.countryOfOrigin,
        ingredients: productDetails?.ingredients,
        nutritionInfo: productDetails?.nutrition,
        allergens: productDetails?.allergens || [],
        
        inStock: item.inStock !== false && item.availability !== 'out_of_stock',
        availability: this.mapAvailability(item.availability),
        
        imageUrl: item.imageUrl || item.image?.url,
        productUrl: `${this.baseUrl}/sm/pickup/rsid/${locationId}/product/${this.slugify(item.name)}/${sku}`
      };
    } catch (error) {
      console.error('Error parsing Save-On-Foods product:', error);
      return null;
    }
  }

  private async getProductDetails(sku: string, locationId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/${locationId}/product/${sku}/details`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Silently fail - product details are optional
    }
    return null;
  }

  private standardizeCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'fresh-produce': 'Fruits & Vegetables',
      'meat-seafood': 'Meat & Seafood',
      'deli-prepared-foods': 'Deli & Prepared Foods',
      'bakery': 'Bakery',
      'dairy-eggs': 'Dairy & Eggs',
      'pantry': 'Pantry & Dry Goods',
      'frozen': 'Frozen Foods',
      'beverages': 'Beverages',
      'snacks-candy': 'Snacks & Candy',
      'health-beauty': 'Health & Beauty',
      'household-cleaning': 'Household & Cleaning',
      'baby-kids': 'Baby & Kids',
      'pet-care': 'Pet Care'
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

  private mapAvailability(availability: string): 'in_stock' | 'low_stock' | 'out_of_stock' | undefined {
    if (!availability) return 'in_stock';
    
    const lower = availability.toLowerCase();
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

  private generateCorrelationId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private mapCategoryToId(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'fresh-produce': '101',
      'meat-seafood': '102',
      'deli-prepared-foods': '103',
      'bakery': '104',
      'dairy-eggs': '105',
      'pantry': '106',
      'frozen': '107',
      'beverages': '108',
      'snacks-candy': '109',
      'health-beauty': '110',
      'household-cleaning': '111',
      'baby-kids': '112',
      'pet-care': '113'
    };
    
    return categoryMap[category] || category;
  }
} 