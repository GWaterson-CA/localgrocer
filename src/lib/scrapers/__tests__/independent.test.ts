import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndependentScraper } from '../independent';

describe('IndependentScraper', () => {
  const mockEnv = {
    PCX_API_KEY: 'test-api-key'
  };

  beforeEach(() => {
    vi.stubEnv('PCX_API_KEY', mockEnv.PCX_API_KEY);
  });

  it('should throw error when PCX_API_KEY is missing', () => {
    vi.unstubAllEnvs();
    expect(() => new IndependentScraper()).toThrow('Missing PCX_API_KEY in environment variables');
  });

  it('should initialize with valid API key', () => {
    const scraper = new IndependentScraper();
    expect(scraper.getStoreName()).toBe('Independent Grocer');
  });

  it('should filter grocery items correctly', () => {
    const scraper = new IndependentScraper();
    const mockItems = [
      { category: 'produce', name: 'Bananas' },
      { category: 'electronics', name: 'TV' },
      { category: 'dairy', name: 'Milk' }
    ];

    const groceryItems = mockItems.filter(item => (scraper as any).isGrocery(item));
    expect(groceryItems).toHaveLength(2);
    expect(groceryItems.map(item => item.name)).toEqual(['Bananas', 'Milk']);
  });

  it('should transform data correctly', () => {
    const scraper = new IndependentScraper();
    const mockData = {
      items: [
        {
          id: '123',
          name: 'Milk',
          category: 'dairy',
          regularPrice: 4.99,
          salePrice: 3.99,
          saleEndDate: '2024-03-20',
          unit: 'L',
          size: '2'
        }
      ]
    };

    const result = (scraper as any).transformData(mockData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      sku: '123',
      name: 'Milk',
      store: 'Independent Grocer',
      price: expect.any(Number),
      wasPrice: 4.99,
      saleEnds: new Date('2024-03-20'),
      unit: expect.any(String),
      size: '2'
    });
  });
}); 