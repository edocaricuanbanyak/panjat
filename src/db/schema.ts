/**
 * Panjat database schema — PRD §17.2.
 *
 * Conventions (non-negotiable, see CLAUDE.md):
 *  - Money is integer rupiah stored as BIGINT (no floats, no decimals).
 *  - All timestamps are timestamptz, stored in UTC; WIB is a display concern only.
 *  - Table/column names use the PRD's Indonesian domain vocabulary verbatim.
 *  - `pegangan` is a ledger (pegangan_ledger, append-only); listing.pegangan_cached
 *    is only a sort cache and must reconcile to SUM(nominal_signed).
 *
 * DB-level invariants that Drizzle cannot express (the listing state-machine trigger
 * and the append-only guards on pegangan_ledger/klik) live in the hand-authored SQL
 * migration drizzle/0001_triggers.sql.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// --- Enums (closed sets fixed by the PRD) ---------------------------------

export const listingStatus = pgEnum("listing_status", [
  "draft",
  "menunggu_bayar",
  "tayang",
  "kedaluwarsa",
  "ditahan",
  "ditolak",
  "diturunkan",
]);

export const ledgerJenis = pgEnum("ledger_jenis", [
  "bayar",
  "rosot",
  "refund",
  "koreksi",
]);

export const moderasiAktor = pgEnum("moderasi_aktor", [
  "ai",
  "manusia",
  "sistem",
]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

// --- Core entities --------------------------------------------------------

export const kategori = pgTable("kategori", {
  id: uuid("id").defaultRandom().primaryKey(),
  nama: text("nama").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: createdAt(),
});

export const sponsorKontak = pgTable("sponsor_kontak", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email"),
  wa: text("wa"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  // Unsubscribe from "kamu disalip" notifications (R3).
  notifOptOut: boolean("notif_opt_out").notNull().default(false),
  createdAt: createdAt(),
});

export const listing = pgTable("listing", {
  id: uuid("id").defaultRandom().primaryKey(),
  // url_normal unique enforces one-URL-one-listing (R2).
  urlNormal: text("url_normal").notNull().unique(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  kategoriId: uuid("kategori_id").references(() => kategori.id),
  logoPath: text("logo_path"),
  status: listingStatus("status").notNull().default("draft"),
  // Sort cache only — reconciles to SUM(pegangan_ledger.nominal_signed).
  peganganCached: bigint("pegangan_cached", { mode: "number" })
    .notNull()
    .default(0),
  kontakId: uuid("kontak_id").references(() => sponsorKontak.id),
  catatan: text("catatan"), // honest "seed" label etc. (R11)
  // Site screenshot (R21) — own storage/CDN path; null falls back to og:image/logo.
  screenshotUrl: text("screenshot_url"),
  screenshotAt: timestamp("screenshot_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// --- Money: append-only ledger + payments ---------------------------------

// pegangan = Σ(bayar) − Σ(rosot) − Σ(refund) ± koreksi (§17.2 Prinsip 1).
// Append-only enforced by trigger in 0001_triggers.sql.
export const peganganLedger = pgTable("pegangan_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id),
  jenis: ledgerJenis("jenis").notNull(),
  // Signed: bayar/koreksi may be +, rosot/refund are − (no non-negative check).
  nominalSigned: bigint("nominal_signed", { mode: "number" }).notNull(),
  // Midtrans order_id, cron-run id, or moderation ref.
  ref: text("ref"),
  createdAt: createdAt(),
});

export const transaksi = pgTable(
  "transaksi",
  {
    orderId: text("order_id").primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listing.id),
    nominal: bigint("nominal", { mode: "number" }).notNull(),
    metode: text("metode"),
    status: text("status").notNull(),
    webhookAt: timestamp("webhook_at", { withTimezone: true }),
    rawPayload: jsonb("raw_payload"),
    createdAt: createdAt(),
  },
  (t) => [check("transaksi_nominal_nonneg", sql`${t.nominal} >= 0`)],
);

// Jaga Posisi (§13.1, F4) — auto top-up to keep a listing at a target tier via a
// recurring card/e-wallet token (never a stored balance). One config per listing.
// `budget_sisa` caps total auto-spend; `token` is the Midtrans recurring token
// (null = not linked yet). Auto-charges settle via the normal verified webhook,
// so grip still activates only there.
export const jagaPosisi = pgTable(
  "jaga_posisi",
  {
    listingId: uuid("listing_id")
      .primaryKey()
      .references(() => listing.id),
    target: text("target").notNull(), // "top1" | "top3" | "top10"
    budgetSisa: bigint("budget_sisa", { mode: "number" }).notNull().default(0),
    token: text("token"),
    aktif: boolean("aktif").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [check("jaga_budget_nonneg", sql`${t.budgetSisa} >= 0`)],
);

// --- Clicks (append-only; hashed IP only, R10) ----------------------------

export const klik = pgTable("klik", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id),
  ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
  ipHash: text("ip_hash"), // salted, daily-rotated — never raw
  uaHash: text("ua_hash"),
  referer: text("referer"),
  asal: text("asal"), // origin: papan | jelajah | pencarian (R22)
  valid: boolean("valid").notNull().default(true),
});

export const klikHarian = pgTable(
  "klik_harian",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listing.id),
    tanggal: date("tanggal").notNull(),
    jumlahValid: integer("jumlah_valid").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.listingId, t.tanggal] }),
    check("klik_harian_nonneg", sql`${t.jumlahValid} >= 0`),
  ],
);

// --- History / audit / config ---------------------------------------------

// Hourly rank/grip snapshot — feeds the 7-day chart (R4) and is the ONLY
// source for badges/lencana (R17).
export const posisiSnapshot = pgTable("posisi_snapshot", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id),
  jam: timestamp("jam", { withTimezone: true }).notNull(),
  rank: integer("rank").notNull(),
  pegangan: bigint("pegangan", { mode: "number" }).notNull(),
});

export const moderasiLog = pgTable("moderasi_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listing.id),
  aktor: moderasiAktor("aktor").notNull(),
  keputusan: text("keputusan").notNull(),
  alasan: text("alasan"),
  sebelum: text("sebelum"),
  sesudah: text("sesudah"),
  createdAt: createdAt(),
});

export const notifikasiLog = pgTable("notifikasi_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  kontakId: uuid("kontak_id").references(() => sponsorKontak.id),
  kanal: text("kanal").notNull(), // wa | email
  jenis: text("jenis").notNull(),
  statusKirim: text("status_kirim").notNull(),
  createdAt: createdAt(),
});

// §6.6 tunables — never hard-code these in feature code.
export const konfigurasi = pgTable("konfigurasi", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Anonymous visitor / gamification (R14–R17) ---------------------------
// Never touches money, paid ranking, or clicks (§7.5.2).

// Archived daily champion — the answer Tebak Juara resolves against (R15).
// Interim: main-board #1 at reset; switches to Papan Hari Ini's champion when R7 lands.
export const juaraHarian = pgTable("juara_harian", {
  tanggal: date("tanggal").primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id),
  createdAt: createdAt(),
});

export const pengunjungAnon = pgTable("pengunjung_anon", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAt(),
  email: text("email"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
});

export const tebakan = pgTable(
  "tebakan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonId: uuid("anon_id")
      .notNull()
      .references(() => pengunjungAnon.id),
    tanggal: date("tanggal").notNull(),
    listingId: uuid("listing_id").references(() => listing.id),
    createdAt: createdAt(),
  },
  // One guess per visitor per day (R15).
  (t) => [unique("tebakan_anon_tanggal").on(t.anonId, t.tanggal)],
);

// A visitor gets 5 Sorak/day (SORAK_PER_DAY) and may stack them all on a single
// listing — so there is deliberately no (visitor, listing, day) uniqueness; the
// daily cap is enforced in recordSorak (R16).
export const sorak = pgTable("sorak", {
  id: uuid("id").defaultRandom().primaryKey(),
  anonId: uuid("anon_id")
    .notNull()
    .references(() => pengunjungAnon.id),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id),
  tanggal: date("tanggal").notNull(),
  createdAt: createdAt(),
});

export const lencana = pgTable(
  "lencana",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listing.id),
    jenis: text("jenis").notNull(),
    createdAt: createdAt(),
  },
  // A listing earns each badge type at most once (R17).
  (t) => [unique("lencana_listing_jenis").on(t.listingId, t.jenis)],
);

// Reports & URL-ownership claims (R8 "tombol lapor", §18.6). Decided by a human.
export const laporan = pgTable("laporan", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id),
  jenis: text("jenis").notNull(), // lapor | klaim
  pesan: text("pesan"),
  kontak: text("kontak"),
  status: text("status").notNull().default("baru"), // baru | ditutup
  createdAt: createdAt(),
});

// --- Dashboard auth -------------------------------------------------------
// One-time magic-link tokens (§18.2). Sessions are stateless signed cookies
// (no table). Only the token HASH is stored; raw token lives only in the link.
export const magicLink = pgTable("magic_link", {
  id: uuid("id").defaultRandom().primaryKey(),
  kontakId: uuid("kontak_id")
    .notNull()
    .references(() => sponsorKontak.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});
