-- Weekly Kaki Tiang reset: free (Rp0) listings expire at the Wed 17:00 cut-off
-- (the champion graduates to the board, the rest make way for a fresh contest).
-- Re-defines the state-machine guard to allow `tayang -> kedaluwarsa`; every
-- other transition is unchanged.
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
  RAISE EXCEPTION 'Transisi status listing tidak sah: % -> %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;
