import { buttonClasses } from "./Button";
import { PoleMark } from "./PoleMark";

/** Empty state — an invitation, in the pole's voice (§9.3). An empty board is a
 *  critical first-impression moment, so pass `action` to turn it into a CTA.
 *
 *  Every "kosong" surface uses this so the greased-pole identity shows up on
 *  each one, not just the main board. Two densities:
 *  - full (default): a first-impression, whole-page empty (empty board, 404).
 *  - `compact`: an in-section empty living under a heading / sticky search
 *    (Hari Ini, Jelajah results, Kaki Tiang) — smaller pole, tighter padding.
 *  `title` is optional; a bare message renders the pole + one line. */
export function EmptyState({
  title,
  message,
  action,
  compact = false,
}: {
  title?: string;
  message: string;
  action?: { label: string; href: string };
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-4 py-10" : "px-6 py-16"}`}>
      {/* A little greased pole, waiting for a first climber. */}
      <PoleMark className={compact ? "mb-4 h-12 w-5" : "mb-5 h-16 w-6"} />
      {title && <p className="display-md text-tinta">{title}</p>}
      <p className={`max-w-sm text-sm text-tinta-redup ${title ? "mt-1.5" : ""}`}>{message}</p>
      {action && (
        <a href={action.href} className={`${buttonClasses("primary")} mt-5 inline-flex`}>
          {action.label}
        </a>
      )}
    </div>
  );
}
