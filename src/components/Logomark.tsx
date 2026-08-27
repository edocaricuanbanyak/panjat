/**
 * Brand logomark — the greased pole (tiang) with the summit flag in merah, the
 * one place the flag colour earns its keep (§9.6.2: merah = summit + actions).
 * A single climber-grip notch sits partway up. Uses design tokens via fill-*.
 */
export function Logomark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Panjat">
      {/* the pole */}
      <rect x="10.6" y="3" width="2.8" height="18.5" rx="1.4" className="fill-tinta" />
      {/* summit flag (pennant) */}
      <path d="M13.4 3.4 L20.5 6 L13.4 8.6 Z" className="fill-merah" />
      {/* a grip on the way up */}
      <circle cx="12" cy="14.5" r="2.1" className="fill-merah" />
      <circle cx="12" cy="14.5" r="0.9" className="fill-kertas" />
    </svg>
  );
}
