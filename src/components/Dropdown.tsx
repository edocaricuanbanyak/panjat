"use client";

import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { fieldClasses } from "./Input";

export type DropdownOption = { value: string; label: string; icon?: ReactNode };

/**
 * Custom dropdown (not a native <select>): a field-styled trigger + a popover
 * listbox that matches the TextField chrome. Full keyboard support
 * (Up/Down/Home/End/Enter/Esc) with aria-activedescendant; opens on the current
 * selection; closes on outside-click/Escape/Tab and returns focus to the trigger.
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optId = (i: number) => `${baseId}-opt-${i}`;
  const selected = options.find((o) => o.value === value);

  function openMenu() {
    const i = options.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  }
  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  // Outside-click closes.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(optId(active))}`)?.scrollIntoView({
      block: "nearest",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function choose(v: string) {
    onChange(v);
    close(true);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Tab") return setOpen(false);
    if (e.key === "Escape") return close(true);
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      return openMenu();
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
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
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open ? optId(active) : undefined}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKey}
          className={`${fieldClasses} flex cursor-pointer items-center justify-between gap-2 text-left`}
        >
          <span className={`flex min-w-0 items-center gap-2 truncate ${selected ? "text-tinta" : "text-tinta-redup"}`}>
            {selected?.icon}
            <span className="truncate">{selected ? selected.label : placeholder}</span>
          </span>
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-tinta-redup transition-transform ease-panjat ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute z-40 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-garis bg-kertas-1 p-1 shadow-naik"
          >
            {options.map((o, i) => {
              const on = o.value === value;
              return (
                <li
                  key={o.value}
                  id={optId(i)}
                  role="option"
                  aria-selected={on}
                  onClick={() => choose(o.value)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-base transition sm:py-2 sm:text-sm ${
                    i === active ? "bg-kertas-2" : ""
                  } ${on ? "font-medium text-merah-teks" : "text-tinta"}`}
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    {o.icon}
                    <span className="truncate">{o.label}</span>
                  </span>
                  {on && <Check className="size-4 shrink-0" aria-hidden />}
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
