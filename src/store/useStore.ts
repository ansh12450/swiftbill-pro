import { useState, useCallback } from 'react';
import { Product, Invoice, ShopSettings } from '@/types/billing';

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Cricket Bat (Kashmir Willow)', price: 1200, gstPercent: 12, category: 'Sports' },
  { id: '2', name: 'Cricket Ball (Leather)', price: 350, gstPercent: 12, category: 'Sports' },
  { id: '3', name: 'Football', price: 800, gstPercent: 12, category: 'Sports' },
  { id: '4', name: 'Badminton Racket', price: 450, gstPercent: 12, category: 'Sports' },
  { id: '5', name: 'Shuttlecock (Pack of 10)', price: 180, gstPercent: 12, category: 'Sports' },
  { id: '6', name: 'Notebook (200 pages)', price: 60, gstPercent: 18, category: 'Stationery' },
  { id: '7', name: 'Pen (Pack of 10)', price: 100, gstPercent: 18, category: 'Stationery' },
  { id: '8', name: 'Pencil Box', price: 150, gstPercent: 18, category: 'Stationery' },
  { id: '9', name: 'Geometry Box', price: 200, gstPercent: 18, category: 'Stationery' },
  { id: '10', name: 'School Bag', price: 900, gstPercent: 18, category: 'Stationery' },
  { id: '11', name: 'Carrom Board', price: 1500, gstPercent: 12, category: 'Sports' },
  { id: '12', name: 'Chess Set', price: 350, gstPercent: 12, category: 'Sports' },
];

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'My Shop',
  address: '123, Main Road, City - 000000',
  gstin: '00AAAAA0000A0A0',
  phone: '9876543210',
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('gstbill_products');
    return saved ? JSON.parse(saved) : SAMPLE_PRODUCTS;
  });

  const saveProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('gstbill_products', JSON.stringify(newProducts));
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: crypto.randomUUID() };
    saveProducts([...products, newProduct]);
    return newProduct;
  }, [products, saveProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    saveProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [products, saveProducts]);

  const deleteProduct = useCallback((id: string) => {
    saveProducts(products.filter(p => p.id !== id));
  }, [products, saveProducts]);

  return { products, addProduct, updateProduct, deleteProduct, setProducts: saveProducts };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('gstbill_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const addInvoice = useCallback((invoice: Invoice) => {
    const updated = [invoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem('gstbill_invoices', JSON.stringify(updated));
  }, [invoices]);

  const getNextInvoiceNumber = useCallback(() => {
    const num = invoices.length + 1;
    return `INV-${String(num).padStart(3, '0')}`;
  }, [invoices]);

  return { invoices, addInvoice, getNextInvoiceNumber };
}

export function useShopSettings() {
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('gstbill_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((updates: Partial<ShopSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('gstbill_settings', JSON.stringify(newSettings));
  }, [settings]);

  return { settings, updateSettings };
}
