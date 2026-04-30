import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SortState } from '../../types';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyState?: ReactNode;
  onRowClick?: (item: T) => void;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  sortState?: SortState | null;
  onSort?: (key: string) => void;
  startIndex?: number;
  endIndex?: number;
}

function SortIcon({ column, sortState }: { column: string; sortState?: SortState | null }) {
  if (!sortState || sortState.key !== column) {
    return <ChevronUp size={14} className="text-gray-300 dark:text-gray-600" />;
  }
  return sortState.direction === 'asc'
    ? <ChevronUp size={14} className="text-emerald-600 dark:text-emerald-400" />
    : <ChevronDown size={14} className="text-emerald-600 dark:text-emerald-400" />;
}

function Pagination({ page, totalPages, total, onPageChange, startIndex, endIndex }: {
  page: number; totalPages: number; total: number;
  onPageChange: (p: number) => void;
  startIndex?: number; endIndex?: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
      <p className="text-xs text-gray-500">
        Showing {(startIndex ?? 0) + 1}–{endIndex ?? total} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PaginationButton onClick={() => onPageChange(1)} disabled={page <= 1} aria-label="First page">
          <ChevronsLeft size={14} />
        </PaginationButton>
        <PaginationButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={14} />
        </PaginationButton>
        {generatePageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">...</span>
          ) : (
            <PaginationButton key={p} onClick={() => onPageChange(p as number)} active={p === page}>
              {p}
            </PaginationButton>
          )
        )}
        <PaginationButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight size={14} />
        </PaginationButton>
        <PaginationButton onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} aria-label="Last page">
          <ChevronsRight size={14} />
        </PaginationButton>
      </div>
    </div>
  );
}

function PaginationButton({ children, onClick, disabled, active, ...props }: {
  children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-colors
        ${active
          ? 'bg-emerald-600 text-white'
          : disabled
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      {...props}
    >
      {children}
    </button>
  );
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No data found', emptyState, onRowClick, page, totalPages, total, onPageChange, sortState, onSort, startIndex, endIndex }: TableProps<T>) {
  const showPagination = page !== undefined && totalPages !== undefined && total !== undefined && onPageChange;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.className || ''} ${col.sortable && onSort ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300' : ''}`}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && onSort && <SortIcon column={col.key} sortState={sortState} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-500 text-sm py-2">
                  {emptyState ?? <div className="py-10">{emptyMessage}</div>}
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      )}
    </div>
  );
}
