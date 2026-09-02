/**
 * Left-accent callout — a quiet note set off by a thin left rule rather than a
 * boxed card. No border/shadow/icon; low-key to match the paper theme.
 */
export function InfoBox({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-l-[3px] border-garis pl-3.5 text-sm leading-relaxed text-tinta-redup ${className}`}
    >
      {children}
    </div>
  );
}
