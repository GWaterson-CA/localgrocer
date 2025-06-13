import { NormalizedPrice, NormalizedUnit } from './types';

export function normalizeUnit(price: number, unit: string, size: string): NormalizedPrice {
  // Convert to lowercase for consistent comparison
  const lowerUnit = unit.toLowerCase();
  const lowerSize = size.toLowerCase();

  // Handle per item cases
  if (lowerUnit.includes('each') || lowerUnit.includes('ea') || lowerUnit.includes('item')) {
    return {
      price,
      unit: 'per_item',
      originalUnit: unit,
      originalSize: size
    };
  }

  // Extract numeric value from size
  const sizeMatch = lowerSize.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb)/);
  if (!sizeMatch) {
    return {
      price,
      unit: 'per_item',
      originalUnit: unit,
      originalSize: size
    };
  }

  const [_, amount, unitType] = sizeMatch;
  const numericAmount = parseFloat(amount);

  // Convert to grams or milliliters
  let baseAmount: number;
  switch (unitType) {
    case 'kg':
      baseAmount = numericAmount * 1000;
      break;
    case 'g':
      baseAmount = numericAmount;
      break;
    case 'l':
      baseAmount = numericAmount * 1000;
      break;
    case 'ml':
      baseAmount = numericAmount;
      break;
    case 'oz':
      baseAmount = numericAmount * 28.35;
      break;
    case 'lb':
      baseAmount = numericAmount * 453.592;
      break;
    default:
      return {
        price,
        unit: 'per_item',
        originalUnit: unit,
        originalSize: size
      };
  }

  // Calculate price per 100g/ml
  const normalizedPrice = (price / baseAmount) * 100;

  return {
    price: normalizedPrice,
    unit: 'per_100g',
    originalUnit: unit,
    originalSize: size
  };
}

export async function getLatestFlippFlyerId(merchantPattern: RegExp, postalCode = 'V6B1A1', locale = 'en-ca'): Promise<number | null> {
  try {
    const url = `https://backflipp.wishabi.com/flipp/flyers?postal_code=${postalCode}&locale=${locale}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.flyers)) return null;
    const flyer = data.flyers.find((f: any) => merchantPattern.test(f.merchant));
    return flyer?.id ?? null;
  } catch (err) {
    console.error('Failed to fetch flipp flyers list', err);
    return null;
  }
} 