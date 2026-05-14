import { Product, fetchProducts } from './supplierService';
import { buildIndex, search } from './search/fuzzySearch';

export class SupplierAggregator {
  private zip: string;
  private cache: Map<string, Product[]> = new Map();

  constructor(zip: string) {
    this.zip = zip;
  }

  async fetchAndIndex(query: string): Promise<Product[]> {
    const cacheKey = `${this.zip}:${query}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const products = await fetchProducts(this.zip, query);
    buildIndex(products);
    this.cache.set(cacheKey, products);
    return products;
  }

  searchLocal(query: string, limit = 20): Product[] {
    return search(query, limit);
  }

  setZip(zip: string) {
    this.zip = zip;
    this.cache.clear();
  }
}
