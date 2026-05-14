import { useEffect, useState } from 'react';
import { fetchProducts, Product } from '../supplier/supplierService';

export function useSupplierData(zip: string, query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zip || !query) return;
    setLoading(true);
    setError(null);

    fetchProducts(zip, query)
      .then(setProducts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [zip, query]);

  return { products, loading, error };
}
