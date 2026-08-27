CREATE TABLE "juara_harian" (
	"tanggal" date PRIMARY KEY NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "juara_harian" ADD CONSTRAINT "juara_harian_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;