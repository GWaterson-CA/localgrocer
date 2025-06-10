import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// Mock flyer data - replace with real API calls later
const mockFlyers = {
  'Save-On-Foods': [
    {
      name: 'Chicken Breast',
      sku: 'CHK001',
      price: 8.99,
      wasPrice: 12.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Ground Beef',
      sku: 'BEEF001',
      price: 6.99,
      wasPrice: 9.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ],
  'Independent': [
    {
      name: 'Pasta',
      sku: 'PASTA001',
      price: 2.99,
      wasPrice: 3.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Cheese',
      sku: 'CHEESE001',
      price: 4.99,
      wasPrice: 6.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ],
  'Nesters': [
    {
      name: 'Tomato Sauce',
      sku: 'SAUCE001',
      price: 1.99,
      wasPrice: 2.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Vegetables',
      sku: 'VEG001',
      price: 3.99,
      wasPrice: 4.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ]
};

export async function GET() {
  try {
    let totalUpdated = 0;

    for (const [store, items] of Object.entries(mockFlyers)) {
      for (const item of items) {
        const result = await prisma.flyerItem.upsert({
          where: {
            sku: `${store}-${item.sku}`
          },
          update: {
            price: item.price,
            wasPrice: item.wasPrice,
            saleEnds: item.saleEnds,
            updatedAt: new Date()
          },
          create: {
            store,
            sku: `${store}-${item.sku}`,
            name: item.name,
            price: item.price,
            wasPrice: item.wasPrice,
            saleEnds: item.saleEnds
          }
        });

        if (result) {
          totalUpdated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${totalUpdated} flyer items`
    });
  } catch (error) {
    console.error('Error updating flyers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update flyers'
      },
      { status: 500 }
    );
  }
} 