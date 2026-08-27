import type { MetadataRoute } from "next";
import { db } from "@/db";
import { listCategories } from "@/domain/jelajah";
import { allTayangIds } from "@/domain/listing-publik";
import { BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, ids] = await Promise.all([listCategories(db), allTayangIds(db)]);
  const url = (path: string) => ({ url: `${BASE_URL}${path}` });

  return [
    url("/"),
    url("/hari-ini"),
    url("/jelajah"),
    url("/aturan"),
    url("/arsip"),
    url("/statistik"),
    ...cats.map((c) => url(`/kategori/${c.slug}`)),
    ...ids.map((id) => url(`/l/${id}`)),
  ];
}
