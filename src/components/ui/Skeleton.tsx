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
