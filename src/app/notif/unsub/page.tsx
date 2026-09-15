import { eq } from "drizzle-orm";
import { buttonClasses } from "@/components/Button";
import { copy } from "@/copy";
import { db } from "@/db";
import { sponsorKontak } from "@/db/schema";
import { verifyUnsub } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** GET /notif/unsub?c=<token> — one-click unsubscribe from disalip notifications (R3). */
export default async function UnsubPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const kontakId = verifyUnsub(c);
  if (kontakId) {
    await db
      .update(sponsorKontak)
      .set({ notifOptOut: true })
      .where(eq(sponsorKontak.id, kontakId));
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="display-md">
        {kontakId ? copy.notif.unsubBerhenti : copy.notif.unsubTidakValid}
      </h1>
      <p className="mt-2 text-sm text-tinta-redup">
        {kontakId ? copy.notif.unsubBerhasil : copy.notif.unsubGagal}
      </p>
      <a href="/" className={`${buttonClasses("secondary", "md")} mt-6 self-center`}>
        {copy.notif.unsubKePapan}
      </a>
    </main>
  );
}
