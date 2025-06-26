import { ComprehensiveScraper, ComprehensiveProduct, StoreLocation } from './types';

export class IndependentComprehensiveScraper implements ComprehensiveScraper {
  private readonly baseUrl = 'https://api.pcexpress.ca';
  private readonly apiUrl = 'https://api.pcexpress.ca/product-facade/v3';
  
  getStoreName(): string {
    return 'independent';
  }

  async getStoreLocations(): Promise<StoreLocation[]> {
    try {
      // Use PC Express store locator API for Independent Grocer banner
      const response = await fetch('https://api.pcexpress.ca/product-facade/v3/stores/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Apikey': '1im1hL52q9xvta16GlSdYDsTsG0dmyhF',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          banner: 'independent',
          lang: 'en',
          searchTerm: '', // Empty to get all stores
          maxResults: 1000
        })
      });

      if (!response.ok) {
        console.error('Failed to fetch Independent Grocer store locations');
        return [];
      }

      const data = await response.json();
      
      return data.results?.map((store: any) => ({
        locationId: store.storeId?.toString(),
        name: store.name || `Independent ${store.address?.city}`,
        address: store.address?.line1 || '',
        city: store.address?.city || '',
        province: store.address?.region || '',
        postalCode: store.address?.postalCode || '',
        phone: store.phone,
        hours: store.hours,
        services: store.services || []
      })) || [];
    } catch (error) {
      console.error('Error fetching Independent Grocer store locations:', error);
      return [];
    }
  }

  async scrapeFullCatalog(locationId: string = '1001'): Promise<ComprehensiveProduct[]> {
    const categories = [
      'produce', 'meat', 'seafood', 'deli', 'bakery', 'dairy',
      'frozen', 'pantry', 'beverages', 'snacks', 'health-beauty',
      'household', 'baby', 'pet'
    ];

    const allProducts: ComprehensiveProduct[] = [];
    
    for (const category of categories) {
      try {
        console.log(`Scraping Independent Grocer category: ${category}`);
        const categoryProducts = await this.scrapeCategory(category, locationId);
        allProducts.push(...categoryProducts);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping category ${category}:`, error);
      }
    }

    console.log(`Independent Grocer: Scraped ${allProducts.length} total products`);
    return allProducts;
  }

  async scrapeCategory(category: string, locationId: string = '1001'): Promise<ComprehensiveProduct[]> {
    const products: ComprehensiveProduct[] = [];
    let from = 0;
    const size = 48;
    
    try {
      while (true) {
        // Use PC Express product search API 
        const response = await fetch(`${this.apiUrl}/products/search`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Apikey': '1im1hL52q9xvta16GlSdYDsTsG0dmyhF',
            'Site-Banner': 'independent',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: JSON.stringify({
            pagination: { from, size },
            banner: 'independent',
            cartId: this.generateCartId(),
            lang: 'en',
            date: this.getCurrentDate(),
            storeId: locationId,
            pcId: false,
            pickupType: 'STORE',
            offerType: 'ALL',
            term: '',
            filters: [{
              type: 'category',
              value: this.mapCategoryToFilter(category)
            }],
            userData: {
              domainUserId: this.generateUserId(),
              sessionId: this.generateSessionId()
            }
          })
        });

        if (!response.ok) {
          console.log(`No more products in category ${category} at offset ${from}`);
          break;
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
          break;
        }

        for (const item of data.results) {
          try {
            const product = await this.parseProduct(item, category, locationId);
            if (product) {
              products.push(product);
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        }

        from += size;
        
        if (from > 5000) {
          console.warn(`Reached offset limit for category ${category}`);
          break;
        }
      }
    } catch (error) {
      console.error(`Error scraping Independent Grocer category ${category}:`, error);
    }

    return products;
  }

  private async parseProduct(item: any, category: string, locationId: string): Promise<ComprehensiveProduct | null> {
    try {
      const sku = item.upc || item.sku || item.productId?.toString();
      if (!sku) return null;

      const regularPrice = parseFloat(item.regularPrice || item.price?.regular || item.price);
      const salePrice = item.salePrice || item.price?.sale;
      
      return {
        sku,
        name: item.name || item.displayName,
        brand: item.brand || item.manufacturer,
        store: this.getStoreName(),
        storeLocation: locationId,
        category: this.standardizeCategory(category),
        subcategory: item.subcategory,
        description: item.description || item.longDescription,
        
        size: item.size || item.packageSize || '1',
        unit: this.determineUnit(item),
        sizePer100g: this.calculateSizePer100g(item.size, item.unit),
        
        regularPrice,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        priceStatus: salePrice ? 'on_sale' : 'regular',
        pricePerUnit: this.calculatePricePerUnit(regularPrice, item.size, item.unit),
        
        countryOfOrigin: item.countryOfOrigin,
        ingredients: item.ingredients,
        nutritionInfo: item.nutritionFacts,
        allergens: item.allergens || [],
        
        inStock: item.inStock !== false,
        availability: this.mapAvailability(item.availability),
        
        imageUrl: item.imageUrl || item.image,
        productUrl: `${this.baseUrl}/en/product/${this.slugify(item.name)}/${sku}`
      };
    } catch (error) {
      console.error('Error parsing Independent Grocer product:', error);
      return null;
    }
  }

  private standardizeCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'produce': 'Fruits & Vegetables',
      'meat': 'Meat & Seafood',
      'seafood': 'Meat & Seafood',
      'deli': 'Deli & Prepared Foods',
      'bakery': 'Bakery',
      'dairy': 'Dairy & Eggs',
      'frozen': 'Frozen Foods',
      'pantry': 'Pantry & Dry Goods',
      'beverages': 'Beverages',
      'snacks': 'Snacks & Candy',
      'health-beauty': 'Health & Beauty',
      'household': 'Household & Cleaning',
      'baby': 'Baby & Kids',
      'pet': 'Pet Care'
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

  private generateCartId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getCurrentDate(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}${day}${year}`;
  }

  private generateUserId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private mapCategoryToFilter(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'produce': 'fruits-vegetables',
      'meat': 'meat-seafood',
      'seafood': 'meat-seafood',
      'deli': 'deli-prepared-foods',
      'bakery': 'bakery',
      'dairy': 'dairy-eggs',
      'frozen': 'frozen',
      'pantry': 'pantry',
      'beverages': 'drinks',
      'snacks': 'snacks-candy',
      'health-beauty': 'health-beauty',
      'household': 'household',
      'baby': 'baby',
      'pet': 'pet-care'
    };
    
    return categoryMap[category] || category;
  }
} 