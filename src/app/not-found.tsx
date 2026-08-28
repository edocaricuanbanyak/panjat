import { buttonClasses } from "@/components/Button";
import { copy } from "@/copy";

/** 404 — plain and reassuring, with a way back to the board. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-tinta-redup">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        {copy.sistem.takAdaJudul}
      </h1>
      <p className="mt-2 text-sm text-tinta-redup">{copy.sistem.takAdaPesan}</p>
      <a href="/" className={`${buttonClasses("primary", "md")} mt-6`}>
        {copy.sistem.kePapan}
      </a>
    </main>
  );
}
