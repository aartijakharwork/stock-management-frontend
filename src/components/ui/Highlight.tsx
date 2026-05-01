interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200/70 dark:bg-amber-500/30 text-inherit rounded-sm px-0.5 ring-1 ring-amber-300/50 dark:ring-amber-500/30">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
