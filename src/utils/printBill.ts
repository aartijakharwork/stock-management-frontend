import type { Bill } from '../types';
import { formatCurrency, formatDate, formatInvoiceNo, gstBreakdown } from './formatters';

interface ShopInfo {
  name: string;
  phone: string;
  address: string;
  gstin: string;
  footerText: string;
  showGstin: boolean;
}

export function printBill(bill: Bill, shop: ShopInfo) {
  const isTax = bill.billType === 'tax_invoice';
  const typeLabel = isTax ? 'TAX INVOICE' : bill.billType === 'estimate' ? 'ESTIMATE' : 'CASH MEMO';
  const invoiceNo = formatInvoiceNo(bill.billNumber || bill.id, bill.date);
  const tax = isTax ? gstBreakdown(bill.total) : null;

  const itemRows = bill.items.map(it => {
    const amt = it.price * it.quantity;
    return `
      <tr>
        <td style="padding:3px 0;font-size:11px">${it.name}</td>
        <td style="padding:3px 0;text-align:right;font-size:11px">${it.quantity}</td>
        <td style="padding:3px 0;text-align:right;font-size:11px">${it.price.toLocaleString('en-IN')}</td>
        <td style="padding:3px 0;text-align:right;font-size:11px">${amt.toLocaleString('en-IN')}</td>
      </tr>`;
  }).join('');

  const totalItems = bill.items.reduce((s, it) => s + it.quantity, 0);

  let totalsHtml = '';
  if (bill.subtotal != null) {
    totalsHtml += row('Subtotal', bill.subtotal.toLocaleString('en-IN'));
  }
  if ((bill.discount ?? 0) > 0) {
    totalsHtml += row('Discount', `- ${bill.discount!.toLocaleString('en-IN')}`);
  }
  if (tax) {
    totalsHtml += row('Taxable', tax.taxable.toLocaleString('en-IN'));
    totalsHtml += row('CGST @ 9%', tax.cgst.toLocaleString('en-IN'));
    totalsHtml += row('SGST @ 9%', tax.sgst.toLocaleString('en-IN'));
  }
  if (bill.roundOff != null && Math.abs(bill.roundOff) > 0.001) {
    totalsHtml += row('Round-off', `${bill.roundOff >= 0 ? '+' : '-'} ${Math.abs(bill.roundOff).toFixed(2)}`);
  }

  const paymentLabel = bill.paymentMethod
    ? bill.paymentMethod.toUpperCase()
    : bill.isUdhaar ? 'UDHAAR' : 'CASH';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${typeLabel} - ${invoiceNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; width:280px; margin:0 auto; padding:12px 0; color:#111; }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  .dash { border-top:1px dashed #999; margin:6px 0; }
  .double { border-top:2px double #333; margin:6px 0; }
  table { width:100%; border-collapse:collapse; }
  .total-row { display:flex; justify-content:space-between; font-size:11px; padding:1px 0; }
  .grand { font-size:14px; font-weight:bold; display:flex; justify-content:space-between; padding:4px 0; }
  @media print {
    body { width:100%; }
    @page { size:80mm auto; margin:4mm; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="bold" style="font-size:14px;text-transform:uppercase;letter-spacing:1px">${shop.name}</div>
    <div style="font-size:10px;margin-top:2px">${shop.address}</div>
    <div style="font-size:10px">Ph: ${shop.phone}</div>
    ${isTax && shop.showGstin ? `<div style="font-size:10px">GSTIN: ${shop.gstin}</div>` : ''}
  </div>

  <div class="dash"></div>
  <div class="center bold" style="font-size:11px;letter-spacing:2px">${typeLabel}</div>
  <div class="dash"></div>

  <div style="font-size:11px">
    <div class="total-row"><span>Inv No</span><span class="bold">${invoiceNo}</span></div>
    <div class="total-row"><span>Date</span><span>${formatDate(bill.date)}</span></div>
    <div class="total-row"><span>Customer</span><span class="bold">${bill.customerName}</span></div>
  </div>

  <div class="dash"></div>

  <table>
    <thead>
      <tr style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">
        <th style="text-align:left;padding:2px 0">Item</th>
        <th style="text-align:right;padding:2px 0;width:35px">Qty</th>
        <th style="text-align:right;padding:2px 0;width:55px">Price</th>
        <th style="text-align:right;padding:2px 0;width:55px">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="dash"></div>

  <div class="total-row"><span>Items</span><span>${totalItems}</span></div>
  ${totalsHtml}

  <div class="double"></div>

  <div class="grand">
    <span>TOTAL</span>
    <span>${formatCurrency(bill.total)}</span>
  </div>

  <div class="dash"></div>

  <div style="font-size:11px">
    <div class="total-row"><span>Payment</span><span>${paymentLabel}</span></div>
    <div class="total-row"><span>Status</span><span>${bill.paymentStatus === 'paid' || bill.paid ? 'PAID' : 'UDHAAR'}</span></div>
    ${bill.udhaarAmount ? `<div class="total-row"><span>Udhaar</span><span>${formatCurrency(bill.udhaarAmount)}</span></div>` : ''}
  </div>

  ${bill.note ? `<div class="dash"></div><div style="font-size:10px"><b>Note:</b> ${bill.note}</div>` : ''}

  <div class="dash"></div>
  <div class="center" style="font-size:10px;padding:4px 0">${shop.footerText}</div>

<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=360,height=600');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

function row(label: string, value: string): string {
  return `<div class="total-row"><span>${label}</span><span>${value}</span></div>`;
}
