import { useMemo, useState } from 'react';
import type { SortDirection, SortState } from '../types';

interface UsePaginationOptions<T> {
  data: T[];
  pageSize?: number;
  initialSort?: SortState;
  sortFns?: Record<string, (a: T, b: T) => number>;
}

interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  pageData: T[];
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  sortState: SortState | null;
  toggleSort: (key: string) => void;
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>({ data, pageSize: defaultPageSize = 10, initialSort, sortFns }: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [sortState, setSortState] = useState<SortState | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sortState || !sortFns?.[sortState.key]) return data;
    const fn = sortFns[sortState.key];
    const sorted = [...data].sort(fn);
    return sortState.direction === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortState, sortFns]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageData = sorted.slice(startIndex, endIndex);

  const toggleSort = (key: string) => {
    setSortState(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' as SortDirection } : null;
      }
      return { key, direction: 'asc' as SortDirection };
    });
    setPage(1);
  };

  const setPageSize = (s: number) => {
    setPageSizeState(s);
    setPage(1);
  };

  return { page: safePage, pageSize, totalPages, total, pageData, setPage, setPageSize, sortState, toggleSort, startIndex, endIndex };
}
