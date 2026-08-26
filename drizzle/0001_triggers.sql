-- DB-level invariants from PRD §17.2 that Drizzle's schema cannot express.
-- Kept in a custom (journal-registered) migration so `drizzle-kit migrate` applies it.

-- 1. Listing state machine (§17.2). Any transition not listed below is rejected
--    at the database, not just the application layer. Same-status updates (e.g.
--    changing pegangan_cached, or flooring grip at Rp1.000 while staying `tayang`)
--    are always allowed.
CREATE OR REPLACE FUNCTION panjat_listing_status_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status::text, NEW.status::text) IN (
    ('draft', 'menunggu_bayar'),
    ('menunggu_bayar', 'tayang'),
    ('menunggu_bayar', 'kedaluwarsa'),
    ('tayang', 'ditahan'),
    ('tayang', 'diturunkan'),
    ('ditahan', 'tayang'),
    ('ditahan', 'ditolak')
  ) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Transisi status listing tidak sah: % -> %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER listing_status_guard
  BEFORE UPDATE ON listing
  FOR EACH ROW
  EXECUTE FUNCTION panjat_listing_status_guard();
--> statement-breakpoint

-- 2. Append-only guard (§17.2 Prinsip 1). The money ledger and raw clicks must be
--    reconstructable, so rows are immutable: UPDATE and DELETE both raise.
CREATE OR REPLACE FUNCTION panjat_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabel % bersifat append-only: % ditolak', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER pegangan_ledger_append_only
  BEFORE UPDATE OR DELETE ON pegangan_ledger
  FOR EACH ROW
  EXECUTE FUNCTION panjat_append_only();
--> statement-breakpoint
CREATE TRIGGER klik_append_only
  BEFORE UPDATE OR DELETE ON klik
  FOR EACH ROW
  EXECUTE FUNCTION panjat_append_only();
