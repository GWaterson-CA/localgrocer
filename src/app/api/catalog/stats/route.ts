import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get total product counts by store
    const totalsByStore = await prisma.product.groupBy({
      by: ['store'],
      _count: {
        id: true
      }
    });

    // Get product counts by category
    const totalsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get product counts by store and category
    const totalsByStoreAndCategory = await prisma.product.groupBy({
      by: ['store', 'category'],
      _count: {
        _all: true
      }
    });

    // Get price status distribution
    const priceStatusDistribution = await prisma.product.groupBy({
      by: ['priceStatus'],
      _count: {
        _all: true
      }
    });

    // Get availability distribution
    const availabilityDistribution = await prisma.product.groupBy({
      by: ['availability'],
      _count: {
        _all: true
      }
    });

    // Get store locations count
    const storeLocations = await prisma.storeLocation.groupBy({
      by: ['store'],
      _count: {
        _all: true
      }
    });

    // Get latest update timestamp
    const latestUpdate = await prisma.product.findFirst({
      select: {
        lastUpdated: true
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });

    // Calculate grand total
    const grandTotal = totalsByStore.reduce((sum, store) => sum + store._count._all, 0);

    // Get top brands by product count
    const topBrands = await prisma.product.groupBy({
      by: ['brand'],
      _count: {
        _all: true
      },
      where: {
        brand: {
          not: null
        }
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 10
    });

    // Calculate some interesting metrics
    const onSaleCount = await prisma.product.count({
      where: {
        priceStatus: 'on_sale'
      }
    });

    const inStockCount = await prisma.product.count({
      where: {
        inStock: true
      }
    });

    const withNutritionInfo = await prisma.product.count({
      where: {
        nutritionInfo: {
          not: null
        }
      }
    });

    const withCountryOfOrigin = await prisma.product.count({
      where: {
        countryOfOrigin: {
          not: null
        }
      }
    });

    return NextResponse.json({
      success: true,
      catalog: {
        grandTotal,
        lastUpdated: latestUpdate?.lastUpdated,
        stores: totalsByStore.map(store => ({
          store: store.store,
          totalProducts: store._count._all
        })),
        categories: totalsByCategory.map(cat => ({
          category: cat.category,
          totalProducts: cat._count._all
        })),
        storeAndCategoryBreakdown: totalsByStoreAndCategory.map(item => ({
          store: item.store,
          category: item.category,
          totalProducts: item._count._all
        })),
        priceStatus: priceStatusDistribution.map(status => ({
          status: status.priceStatus,
          count: status._count._all
        })),
        availability: availabilityDistribution.map(avail => ({
          status: avail.availability,
          count: avail._count._all
        })),
        storeLocations: storeLocations.map(loc => ({
          store: loc.store,
          locationCount: loc._count._all
        })),
        topBrands: topBrands.map(brand => ({
          brand: brand.brand,
          productCount: brand._count._all
        })),
        metrics: {
          productsOnSale: onSaleCount,
          productsInStock: inStockCount,
          productsWithNutrition: withNutritionInfo,
          productsWithOrigin: withCountryOfOrigin,
          salePercentage: grandTotal > 0 ? ((onSaleCount / grandTotal) * 100).toFixed(2) : '0',
          stockPercentage: grandTotal > 0 ? ((inStockCount / grandTotal) * 100).toFixed(2) : '0',
          nutritionCoverage: grandTotal > 0 ? ((withNutritionInfo / grandTotal) * 100).toFixed(2) : '0',
          originCoverage: grandTotal > 0 ? ((withCountryOfOrigin / grandTotal) * 100).toFixed(2) : '0'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching catalog statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch catalog statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 