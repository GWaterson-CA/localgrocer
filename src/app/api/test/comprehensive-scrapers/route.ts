import { NextResponse } from 'next/server';
import { SaveOnComprehensiveScraper } from '@/lib/scrapers/saveon-comprehensive';
import { IndependentComprehensiveScraper } from '@/lib/scrapers/independent-comprehensive';
import { NestersComprehensiveScraper } from '@/lib/scrapers/nesters-comprehensive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scrapers = [
      new SaveOnComprehensiveScraper(),
      new IndependentComprehensiveScraper(),
      new NestersComprehensiveScraper()
    ];

    const results = await Promise.allSettled(
      scrapers.map(async (scraper) => {
        try {
          console.log(`Testing ${scraper.getStoreName()} scraper...`);
          
          // Test getting store locations
          const locations = await scraper.getStoreLocations();
          console.log(`${scraper.getStoreName()}: Found ${locations.length} locations`);
          
          // Test scraping a single category to verify the API works
          const testCategory = 'fresh-produce'; // or equivalent for each store
          const products = await scraper.scrapeCategory(testCategory, locations[0]?.locationId);
          console.log(`${scraper.getStoreName()}: Scraped ${products.length} products from ${testCategory}`);
          
          return {
            store: scraper.getStoreName(),
            success: true,
            locationsFound: locations.length,
            sampleLocations: locations.slice(0, 3),
            testCategory,
            productsFromTestCategory: products.length,
            sampleProducts: products.slice(0, 5).map(p => ({
              sku: p.sku,
              name: p.name,
              brand: p.brand,
              category: p.category,
              price: p.regularPrice,
              salePrice: p.salePrice,
              size: p.size,
              inStock: p.inStock
            })),
            error: null
          };
        } catch (error) {
          console.error(`Error testing ${scraper.getStoreName()}:`, error);
          return {
            store: scraper.getStoreName(),
            success: false,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              cause: error.cause
            } : 'Unknown error',
            locationsFound: 0,
            productsFromTestCategory: 0
          };
        }
      })
    );

    const summary = results.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        store: 'unknown', 
        success: false, 
        error: 'Promise rejected',
        locationsFound: 0,
        productsFromTestCategory: 0 
      }
    );

    const totalProducts = summary.reduce((sum, result) => sum + (result.productsFromTestCategory || 0), 0);
    const successfulStores = summary.filter(result => result.success).length;

    return NextResponse.json({
      success: true,
      message: `Tested ${scrapers.length} comprehensive scrapers`,
      summary: {
        totalStoresTested: scrapers.length,
        successfulStores,
        failedStores: scrapers.length - successfulStores,
        totalSampleProducts: totalProducts,
        estimatedFullCatalogSize: totalProducts * 20 // Rough estimate if this was full scraping
      },
      storeResults: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing comprehensive scrapers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          cause: error.cause
        } : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 