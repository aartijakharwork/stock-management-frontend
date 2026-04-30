type Size = 'xs' | 'sm' | 'md' | 'lg';
type Tone = 'primary' | 'neutral' | 'white';

interface SpinnerProps {
  size?: Size;
  tone?: Tone;
  label?: string;
  className?: string;
}

const sizeMap: Record<Size, { box: number; stroke: number }> = {
  xs: { box: 12, stroke: 2 },
  sm: { box: 16, stroke: 2 },
  md: { box: 22, stroke: 2.5 },
  lg: { box: 32, stroke: 3 },
};

const toneMap: Record<Tone, string> = {
  primary: 'text-emerald-600 dark:text-emerald-400',
  neutral: 'text-gray-500 dark:text-gray-400',
  white: 'text-white',
};

export function Spinner({ size = 'md', tone = 'primary', label, className = '' }: SpinnerProps) {
  const { box, stroke } = sizeMap[size];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 ${toneMap[tone]} ${className}`}
    >
      <svg
        width={box}
        height={box}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.18" strokeWidth={stroke} />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="text-sm font-medium">{label}</span>}
    </span>
  );
}
