import { Scraper, ScrapedItem } from './types';
import { normalizeUnit, getLatestFlippFlyerId } from './utils';

export class NestersScraper implements Scraper {
  private readonly merchantPattern = /Nesters Market/i;

  getStoreName(): string {
    return 'nesters';
  }

  private isGrocery(item:any){return !!item.price && parseFloat(item.price)>0 && parseFloat(item.price)<30;}

  async scrape():Promise<ScrapedItem[]>{
    const flyerId=await getLatestFlippFlyerId(this.merchantPattern,'V6B1A1');
    if(!flyerId){console.error('NestersScraper flyer id not found');return [];} 
    try{
      const res=await fetch(`https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-ca`,{headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'}});
      if(!res.ok){console.error('NestersScraper fetch fail',res.status,res.statusText);return [];} 
      const data=await res.json();
      if(!Array.isArray(data.items))return [];
      return data.items.filter((it:any)=>this.isGrocery(it)).map((it:any)=>{
        const norm=normalizeUnit(parseFloat(it.price),'each','1');
        return{sku:String(it.id),name:it.name,store:this.getStoreName(),unit:norm.unit,size:'1',regularPrice:norm.price,salePrice:norm.price,saleEnds:it.valid_to?new Date(it.valid_to):undefined};});
    }catch(err){console.error('NestersScraper error',err);return [];} 
  }
} 