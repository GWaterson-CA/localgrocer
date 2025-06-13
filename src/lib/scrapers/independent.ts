import { Scraper, ScrapedItem } from './types';
import { normalizeUnit, getLatestFlippFlyerId } from './utils';

export class IndependentScraper implements Scraper {
  private readonly merchantPattern = /Independent Grocer|Your Independent Grocer/i;

  getStoreName(): string {
    return 'independent';
  }

  private isGrocery(item: any): boolean {
    return !!item.price && parseFloat(item.price) > 0 && parseFloat(item.price) < 30;
  }

  async scrape(): Promise<ScrapedItem[]> {
    const flyerId = await getLatestFlippFlyerId(this.merchantPattern, 'K1A0A1'); // Ontario postal code
    if (!flyerId) {
      console.error('IndependentScraper: flyer id not found');
      return [];
    }
    try {
      const res = await fetch(`https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-ca`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) {
        console.error('IndependentScraper fetch fail', res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      if (!Array.isArray(data.items)) return [];
      return data.items.filter((it:any)=>this.isGrocery(it)).map((it:any)=>{
        const norm=normalizeUnit(parseFloat(it.price),'each','1');
        return { sku:String(it.id), name:it.name, store:this.getStoreName(), unit:norm.unit, size:'1', regularPrice:norm.price, salePrice:norm.price, saleEnds: it.valid_to?new Date(it.valid_to):undefined};
      });
    } catch(err){console.error('IndependentScraper error',err);return [];} 
  }
} 