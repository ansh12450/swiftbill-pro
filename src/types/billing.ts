export interface Product {
  id: string;
  name: string;
  price: number;
  gstPercent: number;
  category: string;
  hsn?: string;
}

export interface BillItem {
  id: string;
  productName: string;
  qty: number;
  rate: number;
  amount: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  grandTotal: number;
}

export interface ShopSettings {
  shopName: string;
  address: string;
  gstin: string;
  phone: string;
  email?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  lastBilledAt?: string;
}

export function calculateBillItem(productName: string, qty: number, rate: number, gstPercent: number): BillItem {
  const amount = qty * rate;
  const gstAmount = amount * (gstPercent / 100);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  return {
    id: crypto.randomUUID(),
    productName,
    qty,
    rate,
    amount,
    gstPercent,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    total: Math.round((amount + gstAmount) * 100) / 100,
  };
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const intPart = Math.floor(num);
  const paise = Math.round((num - intPart) * 100);

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  let result = convert(intPart) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  result += ' Only';
  return result;
}
