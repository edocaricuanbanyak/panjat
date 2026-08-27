import { Tabs } from "./Tabs";

type Tab = "sekarang" | "hari-ini" | "jelajah";

const ITEMS = [
  { key: "sekarang", href: "/", label: "Sepanjang Masa" },
  { key: "hari-ini", href: "/hari-ini", label: "Hari Ini" },
  { key: "jelajah", href: "/jelajah", label: "Jelajah" },
];

/**
 * The three board doors as underline tabs (R22, §9.2). Papan is the center;
 * Hari Ini and Jelajah are peers you switch between, not a separate nav.
 */
export function BoardTabs({ active, className = "" }: { active: Tab; className?: string }) {
  return <Tabs items={ITEMS} active={active} variant="garis" className={className} />;
}
