import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No data found', onRowClick }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]" style={{ boxShadow: 'var(--shadow-card)' }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(item => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-[var(--border-color)] last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[var(--hover-bg)]' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-[var(--text-primary)] ${col.className || ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
