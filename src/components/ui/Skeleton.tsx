import { useEffect, useState, type ReactNode } from 'react';

type Rounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: Rounded;
  className?: string;
}

const roundedMap: Record<Rounded, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({ width, height, rounded = 'md', className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${roundedMap[rounded]} ${className}`}
      style={style}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? '70%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
}

// Generic table skeleton — header + N rows × C columns. Used across list pages.
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
}

export function TableSkeleton({ rows = 6, columns = 4, showAvatar = false }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden" aria-busy="true">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={i === columns - 1 ? 60 : 80} height={10} rounded="sm" />
          ))}
        </div>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, r) => (
          <li key={r} className="px-4 py-3.5">
            <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              <div className="flex items-center gap-3 min-w-0">
                {showAvatar && <Skeleton width={32} height={32} rounded="full" />}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton width="70%" height={12} rounded="sm" />
                  <Skeleton width="45%" height={10} rounded="sm" />
                </div>
              </div>
              {Array.from({ length: columns - 1 }).map((_, c) => (
                <Skeleton
                  key={c}
                  width={c === columns - 2 ? '50%' : '80%'}
                  height={12}
                  rounded="sm"
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SkeletonSwapProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

// Smoothly cross-fades between the skeleton and the real content. Skeleton fades
// out (~120ms) while the content fades in (~280ms) — eliminates the harsh swap.
export function SkeletonSwap({ loading, skeleton, children, className = '' }: SkeletonSwapProps) {
  const [showSkeleton, setShowSkeleton] = useState(loading);

  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(false), 140);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div className={`relative ${className}`}>
      {showSkeleton && (
        <div
          className={`transition-opacity duration-150 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!loading}
        >
          {skeleton}
        </div>
      )}
      {!loading && (
        <div className="animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}

// Mobile card skeleton — used alongside the table skeleton on small screens.
export function CardListSkeleton({ rows = 4, showAvatar = true }: { rows?: number; showAvatar?: boolean }) {
  return (
    <ul className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {showAvatar && <Skeleton width={40} height={40} rounded="full" />}
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton width="60%" height={12} rounded="sm" />
              <Skeleton width="40%" height={10} rounded="sm" />
            </div>
            <Skeleton width={64} height={20} rounded="md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
