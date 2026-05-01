import { useEffect, useRef, useState } from 'react';
import { Download, FileText, FileSpreadsheet, Printer, ChevronDown } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, type ExportColumn } from '../../utils/exporters';

type Size = 'sm' | 'md';

interface ExportMenuProps<T> {
  baseName: string;
  title: string;
  meta?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  size?: Size;
  disabled?: boolean;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
}

export function ExportMenu<T>({
  baseName,
  title,
  meta,
  columns,
  rows,
  size = 'sm',
  disabled = false,
  onExport,
}: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isEmpty = rows.length === 0;
  const isDisabled = disabled || isEmpty;

  const sizeClasses = size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-10 px-4 text-[13px]';
  const iconSize = size === 'sm' ? 14 : 15;

  const run = (format: 'csv' | 'excel' | 'pdf') => {
    setOpen(false);
    onExport?.(format);
    if (format === 'csv') exportCSV(baseName, columns, rows);
    else if (format === 'excel') exportExcel(baseName, columns, rows);
    else if (format === 'pdf') exportPDF(title, columns, rows, meta);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
        title={isEmpty ? 'No data to export' : 'Export this list'}
      >
        <Download size={iconSize} />
        Export
        <ChevronDown size={iconSize - 2} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !isDisabled && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-xl overflow-hidden z-30"
        >
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Export {rows.length} record{rows.length === 1 ? '' : 's'}</p>
          </div>
          <button
            role="menuitem"
            onClick={() => run('csv')}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
          >
            <FileText size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">CSV</p>
              <p className="text-[11px] text-gray-500">Comma-separated · Excel/Sheets compatible</p>
            </div>
          </button>
          <button
            role="menuitem"
            onClick={() => run('excel')}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
          >
            <FileSpreadsheet size={16} className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Excel</p>
              <p className="text-[11px] text-gray-500">.xls workbook with formatting</p>
            </div>
          </button>
          <button
            role="menuitem"
            onClick={() => run('pdf')}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-t border-gray-200 dark:border-gray-800"
          >
            <Printer size={16} className="mt-0.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">PDF / Print</p>
              <p className="text-[11px] text-gray-500">Opens print dialog · save as PDF</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
