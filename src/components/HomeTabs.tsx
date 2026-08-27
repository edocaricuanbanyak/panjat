"use client";

import { useState } from "react";
import { copy } from "@/copy";
import { Tabs } from "./Tabs";

type TabKey = "sekarang" | "hari-ini" | "jelajah";

/**
 * The three board doors as in-place tabs (no page navigation). Each panel is
 * server-rendered and passed in; switching just toggles which one shows.
 */
export function HomeTabs({
  sekarang,
  hariIni,
  jelajah,
}: {
  sekarang: React.ReactNode;
  hariIni: React.ReactNode;
  jelajah: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("sekarang");
  const items = [
    { key: "sekarang", label: copy.nav.sepanjangMasa },
    { key: "hari-ini", label: copy.nav.hariIni },
    { key: "jelajah", label: copy.nav.jelajah },
  ];

  return (
    <section>
      <Tabs items={items} active={tab} onSelect={(k) => setTab(k as TabKey)} className="mb-5" />
      {tab === "sekarang" && sekarang}
      {tab === "hari-ini" && hariIni}
      {tab === "jelajah" && jelajah}
    </section>
  );
}
