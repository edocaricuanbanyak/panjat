/**
 * The greased pole as a small standalone mark — a scaled-down echo of the
 * board's signature rail (TiangRail) for empty / 404 / error states, so those
 * moments still carry the product's identity. Purely decorative.
 */
export function PoleMark({ className = "h-16 w-6" }: { className?: string }) {
  return (
    <span className={`flex justify-center ${className}`} aria-hidden>
      <span className="relative flex justify-center">
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2">
          <span
            className="block h-3 w-4 bg-merah"
            style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
          />
        </span>
        <span className="relative h-full w-2 overflow-hidden rounded-full bg-tiang">
          <span className="sheen-licin absolute inset-y-0 left-0.5 w-1 rounded-full opacity-80" />
        </span>
      </span>
    </span>
  );
}
