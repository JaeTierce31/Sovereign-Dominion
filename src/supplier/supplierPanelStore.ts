import { create } from 'zustand';
import { Product } from './supplierService';

interface SupplierPanelState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  setProducts: (products: Product[]) => void;
  selectProduct: (product: Product) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSupplierPanelStore = create<SupplierPanelState>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  setProducts: (products) => set({ products }),
  selectProduct: (product) => set({ selectedProduct: product }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
