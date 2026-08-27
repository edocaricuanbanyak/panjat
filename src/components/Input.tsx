import type { InputHTMLAttributes } from "react";

/** Labeled text input. 16px font avoids iOS Safari zoom; 44px tall (§9.4). */
export function Input({
  label,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm text-tinta-redup">{label}</span>
      <input
        className={`mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta placeholder:text-tinta-redup/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-merah ${className ?? ""}`}
        {...rest}
      />
      {hint && <span className="mt-1 block text-xs text-tinta-redup">{hint}</span>}
    </label>
  );
}
