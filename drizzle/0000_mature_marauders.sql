CREATE TYPE "public"."ledger_jenis" AS ENUM('bayar', 'rosot', 'refund', 'koreksi');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'menunggu_bayar', 'tayang', 'kedaluwarsa', 'ditahan', 'ditolak', 'diturunkan');--> statement-breakpoint
CREATE TYPE "public"."moderasi_aktor" AS ENUM('ai', 'manusia', 'sistem');--> statement-breakpoint
CREATE TABLE "kategori" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kategori_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "klik" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"ua_hash" text,
	"referer" text,
	"valid" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "klik_harian" (
	"listing_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"jumlah_valid" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "klik_harian_listing_id_tanggal_pk" PRIMARY KEY("listing_id","tanggal"),
	CONSTRAINT "klik_harian_nonneg" CHECK ("klik_harian"."jumlah_valid" >= 0)
);
--> statement-breakpoint
CREATE TABLE "konfigurasi" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lencana" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"jenis" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lencana_listing_jenis" UNIQUE("listing_id","jenis")
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url_normal" text NOT NULL,
	"nama" text NOT NULL,
	"deskripsi" text,
	"kategori_id" uuid,
	"logo_path" text,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"pegangan_cached" bigint DEFAULT 0 NOT NULL,
	"kontak_id" uuid,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_url_normal_unique" UNIQUE("url_normal")
);
--> statement-breakpoint
CREATE TABLE "moderasi_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"aktor" "moderasi_aktor" NOT NULL,
	"keputusan" text NOT NULL,
	"alasan" text,
	"sebelum" text,
	"sesudah" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifikasi_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kontak_id" uuid,
	"kanal" text NOT NULL,
	"jenis" text NOT NULL,
	"status_kirim" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pegangan_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"jenis" "ledger_jenis" NOT NULL,
	"nominal_signed" bigint NOT NULL,
	"ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengunjung_anon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text,
	"email_verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "posisi_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"jam" timestamp with time zone NOT NULL,
	"rank" integer NOT NULL,
	"pegangan" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sorak" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anon_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sorak_anon_listing_tanggal" UNIQUE("anon_id","listing_id","tanggal")
);
--> statement-breakpoint
CREATE TABLE "sponsor_kontak" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"wa" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tebakan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anon_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"listing_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tebakan_anon_tanggal" UNIQUE("anon_id","tanggal")
);
--> statement-breakpoint
CREATE TABLE "transaksi" (
	"order_id" text PRIMARY KEY NOT NULL,
	"listing_id" uuid NOT NULL,
	"nominal" bigint NOT NULL,
	"metode" text,
	"status" text NOT NULL,
	"webhook_at" timestamp with time zone,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaksi_nominal_nonneg" CHECK ("transaksi"."nominal" >= 0)
);
--> statement-breakpoint
ALTER TABLE "klik" ADD CONSTRAINT "klik_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "klik_harian" ADD CONSTRAINT "klik_harian_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lencana" ADD CONSTRAINT "lencana_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_kategori_id_kategori_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_kontak_id_sponsor_kontak_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."sponsor_kontak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderasi_log" ADD CONSTRAINT "moderasi_log_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi_log" ADD CONSTRAINT "notifikasi_log_kontak_id_sponsor_kontak_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."sponsor_kontak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegangan_ledger" ADD CONSTRAINT "pegangan_ledger_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posisi_snapshot" ADD CONSTRAINT "posisi_snapshot_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sorak" ADD CONSTRAINT "sorak_anon_id_pengunjung_anon_id_fk" FOREIGN KEY ("anon_id") REFERENCES "public"."pengunjung_anon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sorak" ADD CONSTRAINT "sorak_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tebakan" ADD CONSTRAINT "tebakan_anon_id_pengunjung_anon_id_fk" FOREIGN KEY ("anon_id") REFERENCES "public"."pengunjung_anon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tebakan" ADD CONSTRAINT "tebakan_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;