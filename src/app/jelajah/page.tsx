import type { Metadata } from "next";
import { JelajahPanel } from "@/components/JelajahPanel";
import { PageShell } from "@/components/PageShell";
import { db } from "@/db";
import { jelajahAll, listCategories } from "@/domain/jelajah";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jelajah — Panjat",
  description: "Cari produk, tools, dan jasa buatan Indonesia di Panjat.",
};

export default async function JelajahPage() {
  // Preload every live listing + the category list, then let JelajahPanel do the
  // search and category filtering in-place (no page navigation). Default state
  // ("Semua", no query) shows all URLs. Dedicated /kategori pages still exist and
  // stay crawlable via each card's category tag, listing detail, and the sitemap.
  const [items, cats] = await Promise.all([jelajahAll(db), listCategories(db)]);

  return (
    <PageShell>
      <JelajahPanel items={items} categories={cats} />
    </PageShell>
  );
}
