import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/store/useStore';
import { Product } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, setProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', gstPercent: '18', category: '' });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditId(null); setForm({ name: '', price: '', gstPercent: '18', category: '' }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditId(p.id); setForm({ name: p.name, price: p.price.toString(), gstPercent: p.gstPercent.toString(), category: p.category }); setShowForm(true); };

  const handleSave = () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    const data = { name: form.name, price: parseFloat(form.price), gstPercent: parseFloat(form.gstPercent) || 0, category: form.category || 'General' };
    if (editId) { updateProduct(editId, data); toast.success('Product updated'); }
    else { addProduct(data); toast.success('Product added'); }
    setShowForm(false);
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').slice(1).filter(l => l.trim());
      const imported: Product[] = lines.map(line => {
        const [name, price, gstPercent, category] = line.split(',').map(s => s.trim());
        return { id: crypto.randomUUID(), name, price: parseFloat(price) || 0, gstPercent: parseFloat(gstPercent) || 18, category: category || 'General' };
      }).filter(p => p.name);
      setProducts([...products, ...imported]);
      toast.success(`Imported ${imported.length} products`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
            <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 mr-1" /> Import CSV</span></Button>
          </label>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
        </div>
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 h-9" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3 text-right">Price (₹)</th>
                <th className="py-2 px-3 text-center">GST %</th>
                <th className="py-2 px-3 text-left">Category</th>
                <th className="py-2 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(p => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{p.name}</td>
                    <td className="py-2 px-3 text-right">₹{p.price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center">{p.gstPercent}%</td>
                    <td className="py-2 px-3 text-muted-foreground">{p.category}</td>
                    <td className="py-2 px-3 flex gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { deleteProduct(p.id); toast.success('Deleted'); }} className="text-destructive/60 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No products found</p>}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Name</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Price (₹)</label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">GST %</label><Input type="number" value={form.gstPercent} onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Category</label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Sports, Stationery" /></div>
            <Button className="w-full" onClick={handleSave}>{editId ? 'Update' : 'Add'} Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
