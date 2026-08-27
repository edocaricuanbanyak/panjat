import { asc } from "drizzle-orm";
import { db } from "@/db";
import { kategori } from "@/db/schema";
import { ManjatWizard } from "./ManjatWizard";

export const dynamic = "force-dynamic";

export default async function ManjatPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const [{ url }, kats] = await Promise.all([
    searchParams,
    db.select({ slug: kategori.slug, nama: kategori.nama }).from(kategori).orderBy(asc(kategori.nama)),
  ]);
  return <ManjatWizard initialUrl={url ?? ""} kategori={kats} />;
}
