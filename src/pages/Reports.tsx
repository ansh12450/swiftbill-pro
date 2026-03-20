import { useMemo } from 'react';
import { useInvoices } from '@/store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(234,62%,46%)', 'hsl(38,92%,50%)', 'hsl(152,60%,40%)', 'hsl(0,72%,51%)', 'hsl(270,60%,50%)'];

export default function Reports() {
  const { invoices } = useInvoices();

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(inv => {
      const key = new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + inv.grandTotal;
    });
    return Object.entries(map).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) })).reverse();
  }, [invoices]);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(inv => inv.items.forEach(item => {
      map[item.productName] = (map[item.productName] || 0) + item.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, qty }));
  }, [invoices]);

  const gstSummary = useMemo(() => {
    const totalCgst = invoices.reduce((s, i) => s + i.totalCgst, 0);
    const totalSgst = invoices.reduce((s, i) => s + i.totalSgst, 0);
    return { totalCgst: Math.round(totalCgst * 100) / 100, totalSgst: Math.round(totalSgst * 100) / 100, total: Math.round((totalCgst + totalSgst) * 100) / 100 };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports & Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-sm text-muted-foreground">Total CGST</p>
          <p className="text-xl font-bold mt-1">₹{gstSummary.totalCgst.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-muted-foreground">Total SGST</p>
          <p className="text-xl font-bold mt-1">₹{gstSummary.totalSgst.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-muted-foreground">Total GST</p>
          <p className="text-xl font-bold text-accent mt-1">₹{gstSummary.total.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Monthly Revenue</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,88%)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <Bar dataKey="revenue" fill="hsl(234,62%,46%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-12">Create invoices to see revenue data</p>}
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={topProducts} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, qty }) => `${name}: ${qty}`}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-12">Create invoices to see product data</p>}
        </div>
      </div>
    </div>
  );
}
