import { copy } from "@/copy";
import { Tabs } from "./Tabs";

type Tab = "sekarang" | "hari-ini";

const ITEMS = [
  { key: "sekarang", href: "/", label: copy.nav.sepanjangMasa },
  { key: "hari-ini", href: "/hari-ini", label: copy.nav.hariIni },
];

/**
 * The two board doors as underline tabs (R22, §9.2). Papan is the center;
 * Hari Ini is the peer you switch between. Jelajah lives in the navbar ("Cari"),
 * kept off the board per the "papan vs jelajah dipisah tegas" contract.
 */
export function BoardTabs({ active, className = "" }: { active: Tab; className?: string }) {
  return <Tabs items={ITEMS} active={active} variant="garis" className={className} />;
}
