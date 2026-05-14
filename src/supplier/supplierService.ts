export interface Product {
  description: string;
  unit: string;
  unitPrice: number;
  supplierName: string;
  supplierDistance: number;
  stock: number;
  imageUrl?: string;
  productUrl?: string;
}

export async function fetchProducts(zip: string, query: string): Promise<Product[]> {
  const workerUrl = import.meta.env.VITE_SUPPLIER_WORKER_URL;
  const res = await fetch(`${workerUrl}/?zip=${zip}&query=${encodeURIComponent(query)}`);
  const json = await res.json();
  const items = json.data?.materials?.items || [];
  return items.map((item: any) => ({
    description: item.description || '',
    unit: item.unit || 'each',
    unitPrice: item.unitPrice || 0,
    supplierName: item.supplierName || 'Unknown',
    supplierDistance: item.supplierDistance || 0,
    stock: item.stock || 0,
    imageUrl: item.imageUrl,
    productUrl: item.productUrl,
  }));
}
