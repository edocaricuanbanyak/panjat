/** Empty state — an invitation, in the pole's voice (§9.3). */
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-display text-lg text-tinta">{title}</p>
      <p className="mt-1 text-sm text-tinta-redup">{message}</p>
    </div>
  );
}
