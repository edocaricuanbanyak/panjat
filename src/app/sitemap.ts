import type { MetadataRoute } from "next";
import { db } from "@/db";
import { listCategories } from "@/domain/jelajah";
import { allTayangIds } from "@/domain/listing-publik";
import { BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];
type ChangeFreq = NonNullable<Entry["changeFrequency"]>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, ids] = await Promise.all([listCategories(db), allTayangIds(db)]);

  // Boards decay hourly (rosot), so tell crawlers the money surfaces churn far
  // faster than the static/legal pages — otherwise crawl budget is wasted.
  const now = new Date();
  const url = (
    path: string,
    changeFrequency: ChangeFreq,
    priority: number,
  ): Entry => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency, priority });

  return [
    url("/", "hourly", 1),
    url("/hari-ini", "hourly", 0.9),
    url("/jelajah", "daily", 0.8),
    url("/arsip", "weekly", 0.6),
    url("/statistik", "daily", 0.5),
    url("/aturan", "monthly", 0.4),
    url("/ketentuan", "monthly", 0.3),
    url("/privasi", "monthly", 0.3),
    ...cats.map((c) => url(`/kategori/${c.slug}`, "daily", 0.6)),
    ...ids.map((id) => url(`/l/${id}`, "daily", 0.7)),
  ];
}
