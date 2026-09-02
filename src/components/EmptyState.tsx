import { buttonClasses } from "./Button";

/** Empty state — an invitation, in the pole's voice (§9.3). An empty board is a
 *  critical first-impression moment, so pass `action` to turn it into a CTA. */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-display text-lg text-tinta">{title}</p>
      <p className="mt-1 text-sm text-tinta-redup">{message}</p>
      {action && (
        <a href={action.href} className={`${buttonClasses("primary")} mt-5 inline-flex`}>
          {action.label}
        </a>
      )}
    </div>
  );
}
