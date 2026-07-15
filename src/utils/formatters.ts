export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatInvoiceNo(billIdOrNumber: string, dateIso?: string): string {
  if (/^(INV|CM|EST)-\d{4}-\d{4,}$/.test(billIdOrNumber)) return billIdOrNumber;
  const num = billIdOrNumber.replace(/[^0-9]/g, '').padStart(4, '0');
  const d = dateIso ? new Date(dateIso) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `INV-${year}-${month}-${num}`;
}

const GST_RATE = 0.18;

export function gstBreakdown(totalInclusive: number) {
  const taxable = totalInclusive / (1 + GST_RATE);
  const gst = totalInclusive - taxable;
  const half = gst / 2;
  return {
    taxable: Math.round(taxable),
    cgst: Math.round(half),
    sgst: Math.round(half),
    gst: Math.round(gst),
  };
}

export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 0) return 'just now';
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  if (day < 30) {
    const w = Math.round(day / 7);
    return `${w} week${w === 1 ? '' : 's'} ago`;
  }
  if (day < 365) {
    const mo = Math.round(day / 30);
    return `${mo} month${mo === 1 ? '' : 's'} ago`;
  }
  const yr = Math.round(day / 365);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}
