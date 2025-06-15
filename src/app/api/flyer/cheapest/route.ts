import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CheapestItem {
  id: string;
  store: string;
  sku: string;
  name: string;
  regularPrice: number;
  salePrice: number;
  saleEnds: Date | null;
  unit: string;
  size: string;
}

export async function GET() {
  try {
    // Get the most recent snapshot date
    const [{ max }] = await prisma.$queryRaw<[{ max: Date }]>
      `SELECT MAX("snapshotDate") as max FROM "FlyerItem"`;

    const latestSnapshot = max;
    if (!latestSnapshot) {
      return NextResponse.json({ success: true, items: [] });
    }

    const items = await prisma.$queryRaw<CheapestItem[]>`
      SELECT DISTINCT ON (sku)
        id, store, sku, name,
        "regularPrice", "salePrice", "saleEnds", unit, size
      FROM "FlyerItem"
      WHERE "snapshotDate" = ${latestSnapshot}
      ORDER BY sku, "salePrice" ASC;`;

    return NextResponse.json({ success: true, snapshotDate: latestSnapshot, items });
  } catch (err) {
    console.error('Cheapest flyer API error', err);
    return NextResponse.json({ success: false, error: 'Internal' }, { status: 500 });
  }
} 