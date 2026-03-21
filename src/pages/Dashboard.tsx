import { IndianRupee, TrendingUp, ShoppingCart, Package, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInvoices, useProducts, useShopSettings } from '@/store/useStore';
import { useMemo, useState } from 'react';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Invoice } from '@/types/billing';

export default function Dashboard() {
  const { invoices } = useInvoices();
  const { products } = useProducts();
  const { settings } = useShopSettings();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === today);
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalGst = invoices.reduce((sum, inv) => sum + inv.totalCgst + inv.totalSgst, 0);

    return {
      todaySales,
      todayCount: todayInvoices.length,
      totalRevenue,
      totalGst,
      totalProducts: products.length,
      totalInvoices: invoices.length,
    };
  }, [invoices, products]);

  const cards = [
    { label: "Today's Sales", value: `₹${stats.todaySales.toLocaleString('en-IN')}`, sub: `${stats.todayCount} invoices`, icon: IndianRupee, color: 'text-success' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, sub: `${stats.totalInvoices} invoices`, icon: TrendingUp, color: 'text-primary' },
    { label: 'GST Collected', value: `₹${stats.totalGst.toLocaleString('en-IN')}`, sub: 'CGST + SGST', icon: ShoppingCart, color: 'text-accent' },
    { label: 'Products', value: stats.totalProducts.toString(), sub: 'In catalog', icon: Package, color: 'text-muted-foreground' },
  ];

  if (selectedInvoice) {
    return <InvoicePreview invoice={selectedInvoice} settings={settings} onBack={() => setSelectedInvoice(null)} />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="stat-card">
        <h3 className="font-semibold mb-4">Recent Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invoices yet. Go to Billing to create your first invoice!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Invoice #</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-center py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-2">{inv.customerName}</td>
                    <td className="py-2 text-muted-foreground">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-2 text-right font-semibold">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
