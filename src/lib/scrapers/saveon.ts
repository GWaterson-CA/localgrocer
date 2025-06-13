import { Scraper, ScrapedItem } from './types';
import { normalizeUnit, getLatestFlippFlyerId } from './utils';

export class SaveOnScraper implements Scraper {
  private readonly merchantPattern = /Save[- ]?On[- ]?Foods/i;

  getStoreName(): string {
    return 'saveon';
  }

  private isGrocery(item: any): boolean {
    // simple: consider price numeric and less than $30
    return !!item.price && parseFloat(item.price) > 0 && parseFloat(item.price) < 30;
  }

  async scrape(): Promise<ScrapedItem[]> {
    const flyerId = await getLatestFlippFlyerId(this.merchantPattern);
    if (!flyerId) {
      console.error('SaveOnScraper: Could not find flyer id');
      return [];
    }
    try {
      const res = await fetch(`https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-ca`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!res.ok) {
        console.error('SaveOnScraper failed fetch flyer', res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      if (!Array.isArray(data.items)) return [];
      return data.items
        .filter((it: any) => this.isGrocery(it))
        .map((it: any) => {
          const normalized = normalizeUnit(parseFloat(it.price), 'each', '1');
          return {
            sku: String(it.id),
            name: it.name,
            store: this.getStoreName(),
            unit: normalized.unit,
            size: '1',
            regularPrice: normalized.price,
            salePrice: normalized.price,
            saleEnds: it.valid_to ? new Date(it.valid_to) : undefined
          };
        });
    } catch (err) {
      console.error('SaveOnScraper error', err);
      return [];
    }
  }
} 