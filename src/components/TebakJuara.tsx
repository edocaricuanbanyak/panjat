import type { GuessStatus } from "@/domain/tebakan";

/**
 * Tebak Juara panel (R15) — the daily appointment. No login: a guess sets a
 * signed anon cookie. Pure presentation of the visitor's status.
 */
export function TebakJuara({ status }: { status: GuessStatus }) {
  const guessedNama = status.myGuessListingId
    ? (status.candidates.find((c) => c.id === status.myGuessListingId)?.nama ?? "pilihanmu")
    : null;

  return (
    <section className="mt-4 rounded-lg border border-garis bg-kertas-1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-tinta">Tebak Juara hari ini</h2>
        {status.streak > 0 && (
          <span className="tabular text-xs text-merah-teks">Streak {status.streak} hari</span>
        )}
      </div>

      {status.yesterdayChampion && (
        <p className="mt-1 text-xs text-tinta-redup">
          Juara kemarin: <span className="text-tinta">{status.yesterdayChampion.nama}</span>
        </p>
      )}

      {guessedNama ? (
        <p className="mt-3 text-sm text-tinta">
          Kamu menebak <span className="font-semibold">{guessedNama}</span>. Hasilnya diumumkan
          tengah malam.
        </p>
      ) : status.closed ? (
        <p className="mt-3 text-sm text-tinta-redup">
          Tebakan hari ini sudah ditutup. Datang lagi besok pagi.
        </p>
      ) : (
        <form action="/api/tebak" method="post" className="mt-3 flex gap-2">
          <select
            name="listingId"
            required
            defaultValue=""
            className="h-11 flex-1 rounded-md border border-garis bg-kertas-2 px-3 text-base text-tinta"
          >
            <option value="" disabled>
              Siapa yang di puncak nanti malam?
            </option>
            {status.candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-md bg-merah px-4 text-sm font-display font-semibold text-kertas-1">
            Tebak
          </button>
        </form>
      )}
    </section>
  );
}
