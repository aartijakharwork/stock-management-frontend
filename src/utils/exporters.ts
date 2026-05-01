// Lightweight client-side exporters: CSV, Excel-compatible (.xls via HTML),
// and PDF (via the browser's print dialog → "Save as PDF").
// No external dependencies — keeps the bundle lean.

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function buildFilename(base: string, ext: string): string {
  return `${base}-${timestamp()}.${ext}`;
}

export function exportCSV<T>(baseName: string, columns: ExportColumn<T>[], rows: T[]) {
  const headerLine = columns.map(c => escapeCsv(c.header)).join(',');
  const bodyLines = rows.map(row =>
    columns.map(c => escapeCsv(c.accessor(row))).join(',')
  );
  const csv = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n'); // BOM helps Excel detect UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, buildFilename(baseName, 'csv'));
}

// Excel reads HTML tables saved as .xls quite well — keeps numbers, formatting, no extra dep.
export function exportExcel<T>(baseName: string, columns: ExportColumn<T>[], rows: T[]) {
  const escapeHtml = (v: string | number | null | undefined) =>
    String(v ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  const head = `<tr>${columns.map(c => `<th style="background:#f3f4f6;font-weight:600;padding:6px 10px;border:1px solid #d1d5db;text-align:left">${escapeHtml(c.header)}</th>`).join('')}</tr>`;
  const body = rows.map(row =>
    `<tr>${columns.map(c => `<td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(c.accessor(row))}</td>`).join('')}</tr>`
  ).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"/></head>
<body><table>${head}${body}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, buildFilename(baseName, 'xls'));
}

// Opens a print-ready window with a clean, monochrome HTML table.
// User picks "Save as PDF" in the OS print dialog.
export function exportPDF<T>(title: string, columns: ExportColumn<T>[], rows: T[], meta?: string) {
  const escapeHtml = (v: string | number | null | undefined) =>
    String(v ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  const head = `<tr>${columns.map(c => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr>`;
  const body = rows.map(row =>
    `<tr>${columns.map(c => `<td>${escapeHtml(c.accessor(row))}</td>`).join('')}</tr>`
  ).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 32px; color: #111827 }
  h1 { font-size: 20px; margin: 0 0 4px }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 18px }
  table { width: 100%; border-collapse: collapse; font-size: 12px }
  th, td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top }
  th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #374151 }
  tr:nth-child(even) td { background: #fcfcfd }
  .footer { margin-top: 18px; font-size: 10px; color: #9ca3af; text-align: right }
  @media print {
    body { margin: 16mm }
    .no-print { display: none }
    tr { page-break-inside: avoid }
  }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${escapeHtml(meta || '')} · Generated ${new Date().toLocaleString('en-IN')}</div>
  <table>
    <thead>${head}</thead>
    <tbody>${body}</tbody>
  </table>
  <div class="footer">${rows.length} record${rows.length === 1 ? '' : 's'}</div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 200))</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    alert('Please allow pop-ups for this site to export as PDF.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
