import type { MetadataRoute } from "next";
import { db } from "@/db";
import { listCategories } from "@/domain/jelajah";
import { allTayangIds } from "@/domain/listing-publik";
import { archivedDailyDates } from "@/domain/papan-hari-ini";
import { BASE_URL } from "@/lib/site";
import { zonedDayWindow } from "@/lib/tz";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];
type ChangeFreq = NonNullable<Entry["changeFrequency"]>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [cats, ids, dailyDates] = await Promise.all([
    listCategories(db),
    allTayangIds(db),
    archivedDailyDates(db, now),
  ]);

  // Boards decay hourly (rosot), so tell crawlers the money surfaces churn far
  // faster than the static/legal pages — otherwise crawl budget is wasted.
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
    // Archived daily boards — permanent, deterministically recomputed (R7).
    // lastModified is the day itself; standings never change → yearly.
    ...dailyDates.map(
      (d): Entry => ({
        url: `${BASE_URL}/hari-ini/${d}`,
        // End of that market-tz day (window end minus 1s).
        lastModified: new Date(zonedDayWindow(d).end.getTime() - 1000),
        changeFrequency: "yearly",
        priority: 0.4,
      }),
    ),
  ];
}
