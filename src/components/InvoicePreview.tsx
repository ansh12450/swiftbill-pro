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
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // --- Dark gradient background ---
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, pageH, 'F');

    // --- Top accent bars ---
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageW, 6, 'F');
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 6, pageW, 2, 'F');

    // --- Inner card ---
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, 16, pageW - margin * 2, pageH - 32, 4, 4, 'F');
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 16, pageW - margin * 2, pageH - 32, 4, 4, 'S');

    y = 30;

    // --- ESTIMATE badge ---
    const badgeW = 52;
    const badgeH = 10;
    const badgeX = (pageW - badgeW) / 2;
    doc.setFillColor(79, 82, 221);
    doc.roundedRect(badgeX - 2, y - 2, badgeW + 4, badgeH + 4, 4, 4, 'F');
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(badgeX, y, badgeW, badgeH, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTIMATE', pageW / 2, y + 7, { align: 'center' });
    y += 18;

    // --- Estimate details card ---
    doc.setFillColor(51, 65, 85);
    doc.roundedRect(margin + 4, y, pageW - margin * 2 - 8, 18, 3, 3, 'F');
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estimate: ${invoice.invoiceNumber}`, margin + 8, y + 7);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, pageW - margin - 8, y + 7, { align: 'right' });
    doc.text(`Customer: ${invoice.customerName}`, margin + 8, y + 14);
    y += 24;

    // --- Table ---
    const cols = [margin + 4, 58, 82, 102, 122, 140, 155, 170, 185];
    const headers = ['Product', 'Qty', 'Rate', 'Amt', 'GST%', 'CGST', 'SGST', 'Total'];

    doc.setFillColor(99, 102, 241);
    doc.roundedRect(margin + 4, y - 4, pageW - margin * 2 - 8, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => doc.text(h, cols[i], y + 1));
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    invoice.items.forEach((item, idx) => {
      const rowColor = idx % 2 === 0 ? [30, 41, 59] : [51, 65, 85];
      doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      doc.rect(margin + 4, y - 3.5, pageW - margin * 2 - 8, 6, 'F');

      doc.setTextColor(226, 232, 240);
      const row = [
        item.productName.substring(0, 22),
        item.qty.toString(),
        item.rate.toFixed(0),
        item.amount.toFixed(0),
        item.gstPercent.toString(),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.total.toFixed(2),
      ];
      row.forEach((val, i) => doc.text(val, cols[i], y));
      y += 6;
    });

    y += 4;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(margin + 4, y, pageW - margin - 4, y);
    y += 8;

    // --- Totals ---
    const totalsX = 130;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.setTextColor(148, 163, 184);
    doc.text('Subtotal:', totalsX, y);
    doc.setTextColor(226, 232, 240);
    doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, pageW - margin - 4, y, { align: 'right' });
    y += 5;
    doc.setTextColor(148, 163, 184);
    doc.text('CGST:', totalsX, y);
    doc.setTextColor(226, 232, 240);
    doc.text(`Rs.${invoice.totalCgst.toFixed(2)}`, pageW - margin - 4, y, { align: 'right' });
    y += 5;
    doc.setTextColor(148, 163, 184);
    doc.text('SGST:', totalsX, y);
    doc.setTextColor(226, 232, 240);
    doc.text(`Rs.${invoice.totalSgst.toFixed(2)}`, pageW - margin - 4, y, { align: 'right' });
    y += 6;

    // Grand total with glow
    doc.setFillColor(79, 82, 221);
    doc.roundedRect(totalsX - 6, y - 6, pageW - margin - totalsX + 10, 14, 3, 3, 'F');
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(totalsX - 4, y - 4, pageW - margin - totalsX + 8, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', totalsX, y + 3);
    doc.text(`Rs.${invoice.grandTotal.toFixed(2)}`, pageW - margin - 4, y + 3, { align: 'right' });
    y += 14;

    // Amount in words
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(numberToWords(invoice.grandTotal), margin + 4, y);

    // --- Bottom accent bars ---
    doc.setFillColor(139, 92, 246);
    doc.rect(0, pageH - 2, pageW, 2, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(0, pageH - 8, pageW, 6, 'F');
    doc.setTextColor(199, 210, 254);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated with GST Billing App', pageW / 2, pageH - 3, { align: 'center' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded!');
  };

  const handleWhatsApp = () => {
    const text = `*ESTIMATE*\n\n*Estimate: ${invoice.invoiceNumber}*\nDate: ${new Date(invoice.date).toLocaleDateString('en-IN')}\nCustomer: ${invoice.customerName}\n\n${invoice.items.map((i, idx) => `${idx + 1}. ${i.productName} x${i.qty} = ₹${i.total.toFixed(2)}`).join('\n')}\n\n*Grand Total: ₹${invoice.grandTotal.toFixed(2)}*\n${numberToWords(invoice.grandTotal)}`;
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
        <div className="text-center border-b border-border pb-4 mb-4">
          <div className="text-sm font-semibold border-y border-border py-1">ESTIMATE</div>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Estimate: </span>
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
