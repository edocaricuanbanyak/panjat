"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { fieldClasses } from "./Input";

export type DropdownOption = { value: string; label: string };

/**
 * Custom dropdown (not a native <select>): a field-styled trigger + a glass
 * popover listbox. Closes on outside-click/Escape; basic arrow-key navigation.
 * Matches TextField chrome so all form controls read as one system.
 */
export function Dropdown({
  label,
  hint,
  options,
  value,
  onChange,
  placeholder = "Pilih…",
  className = "",
}: {
  label?: string;
  hint?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => {
        const next = e.key === "ArrowDown" ? a + 1 : a - 1;
        return (next + options.length) % options.length;
      });
    }
    if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt.value);
    }
  }

  return (
    <div className={`block ${className}`} ref={rootRef}>
      {label && <span className="mb-1 block text-sm font-medium text-tinta-redup">{label}</span>}
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={onKey}
          className={`${fieldClasses} flex cursor-pointer items-center justify-between text-left`}
        >
          <span className={selected ? "text-tinta" : "text-tinta-redup/60"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-tinta-redup transition-transform ease-panjat ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-40 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-garis bg-kertas-1 p-1 shadow-naik"
          >
            {options.map((o, i) => {
              const on = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => choose(o.value)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      i === active ? "bg-kertas-2" : ""
                    } ${on ? "font-medium text-merah" : "text-tinta"}`}
                  >
                    {o.label}
                    {on && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-tinta-redup">{hint}</span>}
    </div>
  );
}
