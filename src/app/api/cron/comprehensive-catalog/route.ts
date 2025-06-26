import { NextResponse } from 'next/server';
import { SaveOnComprehensiveScraper } from '@/lib/scrapers/saveon-comprehensive';
import { IndependentComprehensiveScraper } from '@/lib/scrapers/independent-comprehensive';
import { NestersComprehensiveScraper } from '@/lib/scrapers/nesters-comprehensive';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for comprehensive scraping

export async function GET() {
  try {
    console.log('Starting comprehensive catalog scraping...');
    
    const scrapers = [
      new SaveOnComprehensiveScraper(),
      new IndependentComprehensiveScraper(),
      new NestersComprehensiveScraper()
    ];

    const results = await Promise.allSettled(
      scrapers.map(async (scraper) => {
        console.log(`Starting scraping for ${scraper.getStoreName()}`);
        
        try {
          // Get store locations first
          const locations = await scraper.getStoreLocations();
          console.log(`Found ${locations.length} locations for ${scraper.getStoreName()}`);
          
          // Store location data
          for (const location of locations) {
            await prisma.storeLocation.upsert({
              where: {
                store_locationId: {
                  store: scraper.getStoreName(),
                  locationId: location.locationId
                }
              },
              update: {
                name: location.name,
                address: location.address,
                city: location.city,
                province: location.province,
                postalCode: location.postalCode,
                phone: location.phone,
                hours: location.hours,
                services: location.services
              },
              create: {
                store: scraper.getStoreName(),
                locationId: location.locationId,
                name: location.name,
                address: location.address,
                city: location.city,
                province: location.province,
                postalCode: location.postalCode,
                phone: location.phone,
                hours: location.hours,
                services: location.services
              }
            });
          }

          // Scrape products from the first available location
          const primaryLocation = locations[0]?.locationId;
          if (!primaryLocation) {
            throw new Error(`No locations found for ${scraper.getStoreName()}`);
          }

          const products = await scraper.scrapeFullCatalog(primaryLocation);
          console.log(`Scraped ${products.length} products for ${scraper.getStoreName()}`);
          
          // Store products in database
          let insertedCount = 0;
          let updatedCount = 0;
          
          for (const product of products) {
            try {
              const existingProduct = await prisma.product.findUnique({
                where: {
                  store_sku: {
                    store: product.store,
                    sku: product.sku
                  }
                }
              });

              if (existingProduct) {
                await prisma.product.update({
                  where: {
                    store_sku: {
                      store: product.store,
                      sku: product.sku
                    }
                  },
                  data: {
                    name: product.name,
                    brand: product.brand,
                    storeLocation: product.storeLocation,
                    category: product.category,
                    subcategory: product.subcategory,
                    description: product.description,
                    size: product.size,
                    unit: product.unit,
                    sizePer100g: product.sizePer100g,
                    regularPrice: product.regularPrice,
                    salePrice: product.salePrice,
                    priceStatus: product.priceStatus,
                    pricePerUnit: product.pricePerUnit,
                    countryOfOrigin: product.countryOfOrigin,
                    ingredients: product.ingredients,
                    nutritionInfo: product.nutritionInfo,
                    allergens: product.allergens,
                    inStock: product.inStock,
                    availability: product.availability,
                    imageUrl: product.imageUrl,
                    productUrl: product.productUrl
                  }
                });
                updatedCount++;
              } else {
                await prisma.product.create({
                  data: {
                    store: product.store,
                    sku: product.sku,
                    name: product.name,
                    brand: product.brand,
                    storeLocation: product.storeLocation,
                    category: product.category,
                    subcategory: product.subcategory,
                    description: product.description,
                    size: product.size,
                    unit: product.unit,
                    sizePer100g: product.sizePer100g,
                    regularPrice: product.regularPrice,
                    salePrice: product.salePrice,
                    priceStatus: product.priceStatus,
                    pricePerUnit: product.pricePerUnit,
                    countryOfOrigin: product.countryOfOrigin,
                    ingredients: product.ingredients,
                    nutritionInfo: product.nutritionInfo,
                    allergens: product.allergens,
                    inStock: product.inStock,
                    availability: product.availability,
                    imageUrl: product.imageUrl,
                    productUrl: product.productUrl
                  }
                });
                insertedCount++;
              }
            } catch (productError) {
              console.error(`Error storing product ${product.sku}:`, productError);
            }
          }

          return {
            store: scraper.getStoreName(),
            success: true,
            totalProducts: products.length,
            insertedCount,
            updatedCount,
            locations: locations.length
          };
        } catch (error) {
          console.error(`Error scraping ${scraper.getStoreName()}:`, error);
          return {
            store: scraper.getStoreName(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            totalProducts: 0,
            insertedCount: 0,
            updatedCount: 0,
            locations: 0
          };
        }
      })
    );

    // Calculate totals
    const summary = results.reduce((acc, result) => {
      const data = result.status === 'fulfilled' ? result.value : { store: 'unknown', success: false, totalProducts: 0, insertedCount: 0, updatedCount: 0, locations: 0 };
      
      acc.totalProducts += data.totalProducts;
      acc.totalInserted += data.insertedCount;
      acc.totalUpdated += data.updatedCount;
      acc.totalLocations += data.locations;
      
      if (data.success) {
        acc.successfulStores++;
      } else {
        acc.failedStores++;
      }
      
      acc.storeResults.push(data);
      
      return acc;
    }, {
      totalProducts: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalLocations: 0,
      successfulStores: 0,
      failedStores: 0,
      storeResults: [] as any[]
    });

    console.log('Comprehensive catalog scraping completed:', summary);

    return NextResponse.json({
      success: true,
      message: `Comprehensive catalog scraping completed. Total SKUs: ${summary.totalProducts}`,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in comprehensive catalog cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete comprehensive catalog scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 