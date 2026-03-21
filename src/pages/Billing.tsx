import { useState, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { Plus, Trash2, Mic, MicOff, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BillItem, calculateBillItem, numberToWords } from '@/types/billing';
import { useProducts, useInvoices, useShopSettings, useCustomers } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { InvoicePreview } from '@/components/InvoicePreview';

export default function Billing() {
  const { products } = useProducts();
  const { addInvoice, getNextInvoiceNumber } = useInvoices();
  const { settings } = useShopSettings();
  const { customers, addOrUpdateCustomer } = useCustomers();
  const [items, setItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [listening, setListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRow, setActiveRow] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = useMemo(() => {
    if (!customerName) return customers.slice(0, 5);
    return customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).slice(0, 5);
  }, [customers, customerName]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.slice(0, 8);
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8);
  }, [products, searchTerm]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const totalCgst = items.reduce((s, i) => s + i.cgst, 0);
    const totalSgst = items.reduce((s, i) => s + i.sgst, 0);
    const grandTotal = items.reduce((s, i) => s + i.total, 0);
    return { subtotal: Math.round(subtotal * 100) / 100, totalCgst: Math.round(totalCgst * 100) / 100, totalSgst: Math.round(totalSgst * 100) / 100, grandTotal: Math.round(grandTotal * 100) / 100 };
  }, [items]);

  const addItem = useCallback((product: typeof products[0]) => {
    const item = calculateBillItem(product.name, 1, product.price, product.gstPercent);
    setItems(prev => [...prev, item]);
    setSearchTerm('');
    setShowSuggestions(false);
  }, []);

  const updateItemField = useCallback((id: string, field: 'qty' | 'rate' | 'gstPercent' | 'cgst' | 'sgst', value: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'cgst' || field === 'sgst') {
        const updated = { ...item, [field]: Math.round(value * 100) / 100 };
        updated.total = Math.round((updated.amount + updated.cgst + updated.sgst) * 100) / 100;
        return updated;
      }
      const updated = { ...item, [field]: value };
      const recalc = calculateBillItem(updated.productName, updated.qty, updated.rate, updated.gstPercent);
      return { ...recalc, id: item.id, productName: item.productName };
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, id: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const row = items.findIndex(i => i.id === id);
      const fields = ['qty', 'rate', 'gstPercent'];
      const fieldIdx = fields.indexOf(field);
      if (fieldIdx < fields.length - 1) {
        const next = document.querySelector(`[data-field="${fields[fieldIdx + 1]}"][data-row="${row}"]`) as HTMLElement;
        next?.focus();
      } else if (row < items.length - 1) {
        const next = document.querySelector(`[data-field="qty"][data-row="${row + 1}"]`) as HTMLElement;
        next?.focus();
      } else {
        searchRef.current?.focus();
      }
    }
  }, [items]);

  const generateInvoice = useCallback(() => {
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    if (!customerName.trim()) { toast.error('Enter customer name'); return; }

    const invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: getNextInvoiceNumber(),
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      items: [...items],
      ...totals,
    };

    addOrUpdateCustomer(customerName.trim(), customerPhone.trim() || undefined);
    addInvoice(invoice);
    setLastInvoice(invoice);
    setShowInvoice(true);
    toast.success(`Invoice ${invoice.invoiceNumber} generated!`);
  }, [items, customerName, customerPhone, totals, addInvoice, getNextInvoiceNumber, addOrUpdateCustomer]);

  const newBill = useCallback(() => {
    setItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setShowInvoice(false);
    setLastInvoice(null);
  }, []);

  const startVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      toast.info(`Heard: "${transcript}"`);

      // Simple parsing: "add 2 cricket bats"
      const match = transcript.match(/(?:add\s+)?(\d+)\s+(.+)/);
      if (match) {
        const qty = parseInt(match[1]);
        const name = match[2].trim();
        const product = products.find(p => p.name.toLowerCase().includes(name));
        if (product) {
          const item = calculateBillItem(product.name, qty, product.price, product.gstPercent);
          setItems(prev => [...prev, item]);
          toast.success(`Added ${qty}x ${product.name}`);
        } else {
          toast.error(`Product "${name}" not found`);
        }
      }
      setListening(false);
    };

    recognition.onerror = () => { setListening(false); toast.error('Voice recognition failed'); };
    recognition.onend = () => setListening(false);
  }, [products]);

  if (showInvoice && lastInvoice) {
    return <InvoicePreview invoice={lastInvoice} settings={settings} onBack={newBill} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">New Bill</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startVoice} disabled={listening}>
            {listening ? <MicOff className="h-4 w-4 mr-1 animate-pulse text-destructive" /> : <Mic className="h-4 w-4 mr-1" />}
            {listening ? 'Listening...' : 'Voice'}
          </Button>
          <Button size="sm" onClick={generateInvoice} disabled={items.length === 0}>
            <FileText className="h-4 w-4 mr-1" />
            Generate Invoice
          </Button>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <label className="text-xs text-muted-foreground mb-1 block">Customer Name</label>
            <Input
              ref={customerRef}
              value={customerName}
              onChange={e => { setCustomerName(e.target.value); setShowCustomerSuggestions(true); }}
              onFocus={() => setShowCustomerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
              placeholder="Customer name"
              className="h-9"
            />
            {showCustomerSuggestions && filteredCustomers.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-card border rounded-md shadow-lg mt-1 max-h-36 overflow-auto">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between items-center"
                    onMouseDown={() => {
                      setCustomerName(c.name);
                      setCustomerPhone(c.phone || '');
                      setShowCustomerSuggestions(false);
                    }}
                  >
                    <span>{c.name}</span>
                    {c.phone && <span className="text-muted-foreground text-xs">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Phone (optional)</label>
            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="9876543210" className="h-9" />
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Invoice #</label>
            <Input value={getNextInvoiceNumber()} readOnly className="h-9 bg-muted font-mono text-xs" />
          </div>
        </div>

        {/* Product search */}
        <div className="relative mb-4">
          <Input
            ref={searchRef}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="🔍 Search product to add... (type name)"
            className="h-9"
          />
          {showSuggestions && filteredProducts.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 bg-card border rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between items-center"
                  onMouseDown={() => addItem(p)}
                >
                  <span>{p.name}</span>
                  <span className="text-muted-foreground text-xs">₹{p.price} • GST {p.gstPercent}%</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Billing table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="py-2 px-2 text-left w-10">#</th>
                <th className="py-2 px-2 text-left min-w-[150px]">Product</th>
                <th className="py-2 px-2 text-center w-20">Qty</th>
                <th className="py-2 px-2 text-right w-24">Rate</th>
                <th className="py-2 px-2 text-right w-24">Amount</th>
                <th className="py-2 px-2 text-center w-20">GST%</th>
                <th className="py-2 px-2 text-right w-20">CGST</th>
                <th className="py-2 px-2 text-right w-20">SGST</th>
                <th className="py-2 px-2 text-right w-24 font-semibold">Total</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-1 px-2 text-muted-foreground">{idx + 1}</td>
                    <td className="py-1 px-2 font-medium">{item.productName}</td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => updateItemField(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                        onKeyDown={e => handleKeyDown(e, item.id, 'qty')}
                        data-field="qty"
                        data-row={idx}
                        className="billing-input w-16 text-center"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        min={0}
                        value={item.rate}
                        onChange={e => updateItemField(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleKeyDown(e, item.id, 'rate')}
                        data-field="rate"
                        data-row={idx}
                        className="billing-input w-20 text-right"
                      />
                    </td>
                    <td className="py-1 px-2 text-right">₹{item.amount.toFixed(2)}</td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        min={0}
                        max={28}
                        value={item.gstPercent}
                        onChange={e => updateItemField(item.id, 'gstPercent', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleKeyDown(e, item.id, 'gstPercent')}
                        data-field="gstPercent"
                        data-row={idx}
                        className="billing-input w-16 text-center"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        min={0}
                        value={item.cgst}
                        onChange={e => updateItemField(item.id, 'cgst', parseFloat(e.target.value) || 0)}
                        className="billing-input w-16 text-right"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        min={0}
                        value={item.sgst}
                        onChange={e => updateItemField(item.id, 'sgst', parseFloat(e.target.value) || 0)}
                        className="billing-input w-16 text-right"
                      />
                    </td>
                    <td className="py-1 px-2 text-right font-semibold">₹{item.total.toFixed(2)}</td>
                    <td className="py-1 px-2">
                      <button onClick={() => removeItem(item.id)} className="text-destructive/60 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Search and add products above to start billing</p>
              <p className="text-xs mt-1">Use keyboard Enter to navigate between fields</p>
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card"
        >
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>₹{totals.totalCgst.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>₹{totals.totalSgst.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-semibold">Grand Total</span>
                <span className="total-highlight">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground italic">
                {numberToWords(totals.grandTotal)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
