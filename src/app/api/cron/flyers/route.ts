import { NextResponse } from 'next/server';
import { SaveOnScraper } from '@/lib/scrapers/saveon';
import { IndependentScraper } from '@/lib/scrapers/independent';
import { NestersScraper } from '@/lib/scrapers/nesters';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scrapers = [
      new SaveOnScraper(),
      new IndependentScraper(),
      new NestersScraper()
    ];

    const snapshotDate = new Date();
    const results = await Promise.all(
      scrapers.map(scraper => scraper.scrape())
    );

    // Flatten results and upsert into database
    const allItems = results.flat();
    
    for (const item of allItems) {
      const sale = item.salePrice ?? item.regularPrice;
      await prisma.flyerItem.upsert({
        where: {
          store_sku_snapshotDate: {
            store: item.store,
            sku: item.sku,
            snapshotDate
          }
        },
        update: {
          name: item.name,
          regularPrice: item.regularPrice,
          salePrice: sale,
          saleEnds: item.saleEnds,
          unit: item.unit,
          size: item.size
        },
        create: {
          store: item.store,
          sku: item.sku,
          name: item.name,
          regularPrice: item.regularPrice,
          salePrice: sale,
          saleEnds: item.saleEnds,
          unit: item.unit,
          size: item.size,
          snapshotDate
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and updated ${allItems.length} items`
    });
  } catch (error) {
    console.error('Error in flyer cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update flyer items' },
      { status: 500 }
    );
  }
} 