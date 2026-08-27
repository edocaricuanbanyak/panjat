import type { InputHTMLAttributes } from "react";

/** Shared field chrome so text inputs, selects, and textareas match exactly. */
export const fieldClasses =
  "h-11 w-full rounded-lg border border-garis bg-kertas-1 px-3.5 text-base text-tinta " +
  "shadow-kartu placeholder:text-tinta-redup/60 transition-shadow ease-panjat " +
  "focus-visible:outline-none focus-visible:border-merah focus-visible:ring-2 focus-visible:ring-merah/25";

/** Labeled text input. 16px font avoids iOS Safari zoom; 44px tall (§9.4). */
export function Input({
  label,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-tinta-redup">{label}</span>}
      <input className={`${fieldClasses} ${className ?? ""}`} {...rest} />
      {hint && <span className="mt-1 block text-xs text-tinta-redup">{hint}</span>}
    </label>
  );
}
