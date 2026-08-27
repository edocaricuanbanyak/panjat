CREATE TABLE "jaga_posisi" (
	"listing_id" uuid PRIMARY KEY NOT NULL,
	"target" text NOT NULL,
	"budget_sisa" bigint DEFAULT 0 NOT NULL,
	"token" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jaga_budget_nonneg" CHECK ("jaga_posisi"."budget_sisa" >= 0)
);
--> statement-breakpoint
ALTER TABLE "jaga_posisi" ADD CONSTRAINT "jaga_posisi_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;