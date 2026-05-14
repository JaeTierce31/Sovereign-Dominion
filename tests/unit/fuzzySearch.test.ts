import { describe, it, expect, beforeEach } from 'vitest';
import { buildIndex, search } from '../../src/supplier/search/fuzzySearch';

const SAMPLE_PRODUCTS = [
  { description: 'Allan Block Retaining Wall Block 12in', supplierName: 'Home Depot', category: 'masonry' },
  { description: 'Sakrete Concrete Mix 80lb', supplierName: 'Lowes', category: 'concrete' },
  { description: 'Scotts Turf Builder Mulch 2 cu ft', supplierName: 'Menards', category: 'landscaping' },
  { description: 'Keystone Standard Retaining Wall Block', supplierName: 'SiteOne', category: 'masonry' },
  { description: 'Quikrete Fast-Setting Concrete 50lb', supplierName: 'Home Depot', category: 'concrete' },
];

describe('fuzzySearch', () => {
  beforeEach(() => {
    buildIndex(SAMPLE_PRODUCTS);
  });

  it('returns all products for empty query', () => {
    const results = search('');
    expect(results.length).toBe(SAMPLE_PRODUCTS.length);
  });

  it('finds retaining wall blocks', () => {
    const results = search('retaining wall');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].description.toLowerCase()).toContain('wall');
  });

  it('finds by supplier name', () => {
    const results = search('Home Depot');
    expect(results.some(r => r.supplierName === 'Home Depot')).toBe(true);
  });

  it('handles fuzzy misspelling', () => {
    const results = search('concret');
    expect(results.some(r => r.category === 'concrete')).toBe(true);
  });

  it('respects limit', () => {
    const results = search('', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
