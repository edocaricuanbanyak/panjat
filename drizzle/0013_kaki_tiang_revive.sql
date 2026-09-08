-- Revive an expired Kaki Tiang so a URL is re-usable next period.
-- When the weekly reset lands, non-champion free (Rp0) listings become
-- `kedaluwarsa` but the row (and its unique url_normal) stays. To let the same
-- URL be posted again — free (`-> tayang`) or claimed straight into a paid climb
-- (`-> menunggu_bayar`) — the guard must permit those two revivals. Gated on
-- `pegangan_cached = 0` so only grip-0 rows (Kaki Tiang / never-paid) can revive;
-- a real paid listing that was taken down (`diturunkan`/`ditolak`) cannot.
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
    ('tayang', 'kedaluwarsa'),
    ('ditahan', 'tayang'),
    ('ditahan', 'ditolak')
  ) THEN
    RETURN NEW;
  END IF;
  -- Revive of an expired Kaki Tiang (grip 0): re-posted free, or paid.
  IF OLD.pegangan_cached = 0 AND (OLD.status::text, NEW.status::text) IN (
    ('kedaluwarsa', 'tayang'),
    ('kedaluwarsa', 'menunggu_bayar')
  ) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Transisi status listing tidak sah: % -> %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;
