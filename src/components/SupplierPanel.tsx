import React, { useEffect, useState } from 'react';
import { fetchProducts, Product } from '../supplier/supplierService';
import { search, buildIndex } from '../supplier/search/fuzzySearch';

interface Props {
  zip: string;
  objectType: string;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export function SupplierPanel({ zip, objectType, onSelect, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts(zip, objectType)
      .then(p => { buildIndex(p); setProducts(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [zip, objectType]);

  const displayed = query ? search(query) : products;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-black/90 text-white z-30 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-sm font-bold uppercase tracking-wide">Materials</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="p-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search materials..."
          className="w-full bg-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-4 text-gray-500 text-sm">Loading…</div>}
        {!loading && displayed.map((p, i) => (
          <button
            key={i}
            className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/10 transition"
            onClick={() => onSelect(p)}
          >
            <div className="text-xs font-medium truncate">{p.description}</div>
            <div className="text-xs text-gray-400 mt-1">
              ${p.unitPrice.toFixed(2)}/{p.unit} · {p.supplierName} · {p.supplierDistance.toFixed(1)} mi
            </div>
          </button>
        ))}
        {!loading && displayed.length === 0 && (
          <div className="p-4 text-gray-500 text-sm">No results found.</div>
        )}
      </div>
      <div className="p-3 text-xs text-gray-600 border-t border-white/10">ZIP: {zip}</div>
    </div>
  );
}
