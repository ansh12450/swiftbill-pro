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

    // White background (default) — no colored backgrounds

    // --- ESTIMATE header ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ESTIMATE', pageW / 2, y, { align: 'center' });
    y += 10;

    // --- Table with borders ---
    const cols = [margin + 2, 62, 82, 102, 122, 140, 157, 174];
    const colEdges = [margin, 60, 80, 100, 120, 138, 155, 172, pageW - margin];
    const headers = ['Product', 'Qty', 'Rate', 'Amt', 'GST%', 'CGST', 'SGST', 'Total'];
    const rowH = 7;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // Header row
    const headerY = y;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    // Draw header cell borders & text
    colEdges.forEach(x => doc.line(x, headerY, x, headerY + rowH));
    doc.line(margin, headerY, pageW - margin, headerY);
    doc.line(margin, headerY + rowH, pageW - margin, headerY + rowH);
    headers.forEach((h, i) => doc.text(h, cols[i], headerY + 5));
    y = headerY + rowH;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    invoice.items.forEach((item) => {
      const rowY = y;
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
      // Draw vertical lines for each cell
      colEdges.forEach(x => doc.line(x, rowY, x, rowY + rowH));
      // Draw bottom horizontal line
      doc.line(margin, rowY + rowH, pageW - margin, rowY + rowH);
      row.forEach((val, i) => doc.text(val, cols[i], rowY + 5));
      y += rowH;
    });

    y += 8;

    // --- Totals ---
    const totalsX = 130;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    doc.text('Subtotal:', totalsX, y);
    doc.setTextColor(0, 0, 0);
    doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, pageW - margin, y, { align: 'right' });
    y += 5;
    doc.setTextColor(80, 80, 80);
    doc.text('CGST:', totalsX, y);
    doc.setTextColor(0, 0, 0);
    doc.text(`Rs.${invoice.totalCgst.toFixed(2)}`, pageW - margin, y, { align: 'right' });
    y += 5;
    doc.setTextColor(80, 80, 80);
    doc.text('SGST:', totalsX, y);
    doc.setTextColor(0, 0, 0);
    doc.text(`Rs.${invoice.totalSgst.toFixed(2)}`, pageW - margin, y, { align: 'right' });
    y += 6;

    // Grand total
    doc.setLineWidth(0.5);
    doc.line(totalsX - 2, y - 2, pageW - margin, y - 2);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Grand Total:', totalsX, y + 4);
    doc.text(`Rs.${invoice.grandTotal.toFixed(2)}`, pageW - margin, y + 4, { align: 'right' });
    y += 12;

    // Amount in words
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text(numberToWords(invoice.grandTotal), margin, y);

    // --- Footer ---
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Generated with GST Billing App', pageW / 2, pageH - 10, { align: 'center' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded!');
  };

  const handleWhatsApp = () => {
    const text = `Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}\n\n${invoice.items.map((i, idx) => `${idx + 1}. ${i.productName} x${i.qty} = ₹${i.total.toFixed(2)}`).join('\n')}\n\n*Grand Total: ₹${invoice.grandTotal.toFixed(2)}*\n${numberToWords(invoice.grandTotal)}`;
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

      <div ref={invoiceRef} className="max-w-2xl mx-auto bg-white text-black p-6 border border-black print:shadow-none print:border-black">
        <h2 className="text-center text-xl font-bold mb-4 text-black">ESTIMATE</h2>

        <table className="w-full text-xs mb-4 border border-black border-collapse">
          <thead>
            <tr className="bg-white text-black">
              <th className="py-1.5 px-2 text-left border border-black">#</th>
              <th className="py-1.5 px-2 text-left border border-black">Product</th>
              <th className="py-1.5 px-2 text-center border border-black">Qty</th>
              <th className="py-1.5 px-2 text-right border border-black">Rate</th>
              <th className="py-1.5 px-2 text-right border border-black">Amt</th>
              <th className="py-1.5 px-2 text-center border border-black">GST%</th>
              <th className="py-1.5 px-2 text-right border border-black">CGST</th>
              <th className="py-1.5 px-2 text-right border border-black">SGST</th>
              <th className="py-1.5 px-2 text-right border border-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className="bg-white text-black">
                <td className="py-1.5 px-2 border border-black">{idx + 1}</td>
                <td className="py-1.5 px-2 border border-black">{item.productName}</td>
                <td className="py-1.5 px-2 text-center border border-black">{item.qty}</td>
                <td className="py-1.5 px-2 text-right border border-black">Rs.{item.rate.toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right border border-black">Rs.{item.amount.toFixed(2)}</td>
                <td className="py-1.5 px-2 text-center border border-black">{item.gstPercent}%</td>
                <td className="py-1.5 px-2 text-right border border-black">Rs.{item.cgst.toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right border border-black">Rs.{item.sgst.toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right font-semibold border border-black">Rs.{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm text-black">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs.{invoice.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>CGST</span><span>Rs.{invoice.totalCgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>SGST</span><span>Rs.{invoice.totalSgst.toFixed(2)}</span></div>
            <div className="border-t border-black pt-1 flex justify-between font-bold">
              <span>Grand Total</span>
              <span>Rs.{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-black mt-3 italic">{numberToWords(invoice.grandTotal)}</p>
      </div>
    </div>
  );
}
