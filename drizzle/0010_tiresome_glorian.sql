CREATE TABLE "juara_mingguan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"minggu" date NOT NULL,
	"jenis" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"metrik" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "juara_mingguan_minggu_jenis" UNIQUE("minggu","jenis")
);
--> statement-breakpoint
ALTER TABLE "juara_mingguan" ADD CONSTRAINT "juara_mingguan_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;