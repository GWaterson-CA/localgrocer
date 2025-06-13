import { SaveOnScraper } from '../src/lib/scrapers/saveon';
import { IndependentScraper } from '../src/lib/scrapers/independent';
import { NestersScraper } from '../src/lib/scrapers/nesters';

async function main() {
  const scrapers = [
    new SaveOnScraper(),
    new IndependentScraper(),
    new NestersScraper()
  ];

  for (const scraper of scrapers) {
    console.log(`\nTesting ${scraper.getStoreName()} scraper...`);
    try {
      const items = await scraper.scrape();
      console.log(`Found ${items.length} items`);
      console.log('Sample items:');
      items.slice(0, 5).forEach(item => {
        const sale = item.salePrice ?? item.regularPrice;
        const note = sale === item.regularPrice ? 'no sale' : '';
        console.log(`${item.name} — $${sale.toFixed(2)} (was $${item.regularPrice.toFixed(2)}) ${note}`);
      });
    } catch (error) {
      console.error(`Error testing ${scraper.getStoreName()}:`, error);
    }
  }
}

main().catch(console.error); 