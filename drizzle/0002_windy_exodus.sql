CREATE TABLE "magic_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kontak_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "magic_link" ADD CONSTRAINT "magic_link_kontak_id_sponsor_kontak_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."sponsor_kontak"("id") ON DELETE no action ON UPDATE no action;