-- =====================================================================
-- Migration: Add Full-Text Search to Flashcards
-- =====================================================================
-- Purpose: Add generated tsvector column for full-text search on flashcards
-- Affected Tables: flashcards
-- Special Considerations:
--   - Uses generated column (computed automatically)
--   - GIN index created for fast full-text searches
--   - 'simple' dictionary used for language-agnostic search
-- =====================================================================

-- =====================================================================
-- ADD FULL-TEXT SEARCH COLUMN
-- =====================================================================

-- Add generated tsvector column for full-text search
-- This column is automatically maintained by PostgreSQL
alter table public.flashcards
  add column fts tsvector
  generated always as (
    to_tsvector('simple', coalesce(front, '') || ' ' || coalesce(back, ''))
  ) stored;

comment on column public.flashcards.fts is
  'Full-text search vector (automatically generated from front and back)';

-- Create GIN index for fast full-text searches
-- GIN (Generalized Inverted Index) is optimized for tsvector columns
create index idx_flashcards_fts
  on public.flashcards using gin (fts);

comment on index public.idx_flashcards_fts is
  'GIN index for full-text search on flashcard content';

-- =====================================================================
-- USAGE EXAMPLE (for reference, not executed)
-- =====================================================================
-- To search flashcards using full-text search:
--
-- SELECT * FROM flashcards
-- WHERE fts @@ to_tsquery('simple', 'search & terms')
-- AND user_id = auth.uid()
-- ORDER BY ts_rank(fts, to_tsquery('simple', 'search & terms')) DESC;
-- =====================================================================

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

