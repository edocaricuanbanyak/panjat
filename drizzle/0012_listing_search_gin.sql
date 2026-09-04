-- Full-text search index for Jelajah (R22, §17.3). searchListings() matches
-- to_tsvector('simple', nama || ' ' || coalesce(deskripsi,'')). The 2-arg form
-- with an explicit config ('simple') is IMMUTABLE, so it can back a GIN
-- expression index — the query expression must mirror this exactly to use it.
-- Category name is intentionally NOT indexed (it lives on a joined table);
-- category discovery is served by the dedicated /kategori/[slug] pages.
CREATE INDEX IF NOT EXISTS "listing_search_idx"
  ON "listing"
  USING gin (to_tsvector('simple', "nama" || ' ' || coalesce("deskripsi", '')));
