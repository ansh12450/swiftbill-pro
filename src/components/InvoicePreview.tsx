import { useRef } from 'react';
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Invoice, ShopSettings, numberToWords } from '@/types/billing';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface Props {
  invoice: Invoice;
  settings: ShopSettings;
  onBack: () => void;
}

export function InvoicePreview({ invoice, settings, onBack }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handlePDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    let y = margin;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.shopName, margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.address, margin, y);
    y += 4;
    doc.text(`GSTIN: ${settings.gstin} | Ph: ${settings.phone}`, margin, y);
    y += 8;

    doc.setDrawColor(0);
    doc.line(margin, y, 195, y);
    y += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, y, { align: 'center' });
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice: ${invoice.invoiceNumber}`, margin, y);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, 140, y);
    y += 5;
    doc.text(`Customer: ${invoice.customerName}`, margin, y);
    y += 8;

    // Table header
    const cols = [margin, 55, 80, 100, 120, 140, 155, 170, 185];
    const headers = ['Product', 'Qty', 'Rate', 'Amt', 'GST%', 'CGST', 'SGST', 'Total'];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    headers.forEach((h, i) => doc.text(h, cols[i], y));
    y += 2;
    doc.line(margin, y, 195, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    invoice.items.forEach(item => {
      const row = [
        item.productName.substring(0, 20),
        item.qty.toString(),
        item.rate.toFixed(0),
        item.amount.toFixed(0),
        item.gstPercent.toString(),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.total.toFixed(2),
      ];
      row.forEach((val, i) => doc.text(val, cols[i], y));
      y += 5;
    });

    y += 2;
    doc.line(margin, y, 195, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: Rs.${invoice.subtotal.toFixed(2)}`, 140, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`CGST: Rs.${invoice.totalCgst.toFixed(2)}`, 140, y);
    y += 5;
    doc.text(`SGST: Rs.${invoice.totalSgst.toFixed(2)}`, 140, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Grand Total: Rs.${invoice.grandTotal.toFixed(2)}`, 140, y);
    y += 7;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(numberToWords(invoice.grandTotal), margin, y);

    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded!');
  };

  const handleWhatsApp = () => {
    const text = `*${settings.shopName}*\n${settings.address}\nGSTIN: ${settings.gstin}\n\n*Invoice: ${invoice.invoiceNumber}*\nDate: ${new Date(invoice.date).toLocaleDateString('en-IN')}\nCustomer: ${invoice.customerName}\n\n${invoice.items.map((i, idx) => `${idx + 1}. ${i.productName} x${i.qty} = ₹${i.total.toFixed(2)}`).join('\n')}\n\n*Grand Total: ₹${invoice.grandTotal.toFixed(2)}*\n${numberToWords(invoice.grandTotal)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> New Bill
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Button variant="outline" size="sm" onClick={handlePDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}><Share2 className="h-4 w-4 mr-1" /> WhatsApp</Button>
        </div>
      </div>

      <div ref={invoiceRef} className="stat-card max-w-2xl mx-auto print:shadow-none print:border-0">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-xl font-bold">{settings.shopName}</h2>
          <p className="text-xs text-muted-foreground">{settings.address}</p>
          <p className="text-xs text-muted-foreground">GSTIN: {settings.gstin} | Ph: {settings.phone}</p>
          <div className="mt-2 text-sm font-semibold border-y py-1">TAX INVOICE</div>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Invoice: </span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Date: </span>
            {new Date(invoice.date).toLocaleDateString('en-IN')}
          </div>
        </div>
        <div className="text-sm mb-4">
          <span className="text-muted-foreground">Customer: </span>
          <span className="font-medium">{invoice.customerName}</span>
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-y bg-muted/50 text-muted-foreground">
              <th className="py-1 px-1 text-left">#</th>
              <th className="py-1 px-1 text-left">Product</th>
              <th className="py-1 px-1 text-center">Qty</th>
              <th className="py-1 px-1 text-right">Rate</th>
              <th className="py-1 px-1 text-right">Amt</th>
              <th className="py-1 px-1 text-center">GST%</th>
              <th className="py-1 px-1 text-right">CGST</th>
              <th className="py-1 px-1 text-right">SGST</th>
              <th className="py-1 px-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="py-1 px-1">{idx + 1}</td>
                <td className="py-1 px-1">{item.productName}</td>
                <td className="py-1 px-1 text-center">{item.qty}</td>
                <td className="py-1 px-1 text-right">₹{item.rate.toFixed(2)}</td>
                <td className="py-1 px-1 text-right">₹{item.amount.toFixed(2)}</td>
                <td className="py-1 px-1 text-center">{item.gstPercent}%</td>
                <td className="py-1 px-1 text-right">₹{item.cgst.toFixed(2)}</td>
                <td className="py-1 px-1 text-right">₹{item.sgst.toFixed(2)}</td>
                <td className="py-1 px-1 text-right font-semibold">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{invoice.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>₹{invoice.totalCgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>₹{invoice.totalSgst.toFixed(2)}</span></div>
            <div className="border-t pt-1 flex justify-between font-bold">
              <span>Grand Total</span>
              <span className="total-highlight">₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">{numberToWords(invoice.grandTotal)}</p>
      </div>
    </div>
  );
}
