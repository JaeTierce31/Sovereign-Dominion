import Fuse from 'fuse.js';

let fuse: Fuse<any> | null = null;
let productIndex: any[] = [];

export function buildIndex(products: any[]) {
  productIndex = products;
  fuse = new Fuse(products, {
    keys: ['description', 'supplierName', 'category'],
    threshold: 0.35,
    distance: 100,
    minMatchCharLength: 2,
  });
}

export function search(query: string, limit = 20): any[] {
  if (!fuse) return productIndex.slice(0, limit);
  if (!query.trim()) return productIndex.slice(0, limit);
  return fuse.search(query, { limit }).map(r => r.item);
}
