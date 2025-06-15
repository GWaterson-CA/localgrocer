import { NextResponse } from 'next/server';
import { SaveOnScraper } from '@/lib/scrapers/saveon';
import { IndependentScraper } from '@/lib/scrapers/independent';
import { NestersScraper } from '@/lib/scrapers/nesters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scrapers = [
      new SaveOnScraper(),
      new IndependentScraper(),
      new NestersScraper()
    ];

    const results = await Promise.all(
      scrapers.map(async (scraper) => {
        try {
          const items = await scraper.scrape();
          return {
            store: scraper.getStoreName(),
            count: items.length,
            sample: items.slice(0, 3), // Return first 3 items as a sample
            error: null
          };
        } catch (error) {
          return {
            store: scraper.getStoreName(),
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              cause: error.cause
            } : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      env: {
        hasPcxApiKey: !!process.env.PCX_API_KEY,
        pcxApiKeyLength: process.env.PCX_API_KEY?.length
      }
    });
  } catch (error) {
    console.error('Error testing scrapers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          cause: error.cause
        } : 'Unknown error',
        env: {
          hasPcxApiKey: !!process.env.PCX_API_KEY,
          pcxApiKeyLength: process.env.PCX_API_KEY?.length
        }
      },
      { status: 500 }
    );
  }
} 