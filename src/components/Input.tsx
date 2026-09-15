import type { InputHTMLAttributes } from "react";

/**
 * Shared field chrome so text inputs, selects, and textareas match exactly.
 * Taller on mobile (48px) for comfortable thumbs, 44px on sm+; rounded-xl to
 * match cards/popovers. 16px text avoids iOS Safari zoom.
 *
 * Each field has a default and an error variant. Error uses `galat` (never the
 * brand `merah`, per §9.6.2) for the border + focus ring, so an invalid money
 * field reads as a problem, not a call to action. Pick the variant with
 * `fieldClass(error)` / `textareaClass(error)`, or use the string constants
 * directly.
 */
const fieldBase =
  "h-12 sm:h-11 w-full rounded-xl border bg-kertas-1 px-3.5 text-base text-tinta " +
  "shadow-kartu placeholder:text-tinta-redup/55 transition-shadow ease-panjat " +
  "focus-visible:outline-none focus-visible:ring-2";
export const fieldClasses = `${fieldBase} border-garis focus-visible:border-merah focus-visible:ring-merah/25`;
export const fieldClassesError = `${fieldBase} border-galat focus-visible:border-galat focus-visible:ring-galat/30`;
export const fieldClass = (error?: boolean) => (error ? fieldClassesError : fieldClasses);

/** Textarea chrome — same look as fields, but height comes from `rows`. */
const textareaBase =
  "w-full rounded-xl border bg-kertas-1 px-3.5 py-2.5 text-base text-tinta " +
  "shadow-kartu placeholder:text-tinta-redup/55 transition-shadow ease-panjat resize-y " +
  "focus-visible:outline-none focus-visible:ring-2";
export const textareaClasses = `${textareaBase} border-garis focus-visible:border-merah focus-visible:ring-merah/25`;
export const textareaClassesError = `${textareaBase} border-galat focus-visible:border-galat focus-visible:ring-galat/30`;
export const textareaClass = (error?: boolean) => (error ? textareaClassesError : textareaClasses);

/**
 * Labeled text input. 16px font avoids iOS Safari zoom; 44px tall (§9.4).
 * Pass `error` (a message) to switch to the error variant: galat border,
 * `aria-invalid`, and the message announced via `role="alert"`. `error` wins
 * over `hint` when both are set.
 */
export function Input({
  label,
  hint,
  error,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-tinta-redup">{label}</span>}
      <input
        aria-invalid={error ? true : undefined}
        className={`${fieldClass(!!error)} ${className ?? ""}`}
        {...rest}
      />
      {error ? (
        <span role="alert" className="mt-1 block text-xs text-galat">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-tinta-redup">{hint}</span>
      ) : null}
    </label>
  );
}
