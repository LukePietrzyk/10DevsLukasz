-- =====================================================================
-- Migration: Update flashcards source field and rename ai_batch_id
-- =====================================================================
-- Purpose: Add 'ai-edited' source option and rename ai_batch_id to generation_id
-- Affected Tables: flashcards
-- Changes:
--   1. Update source field constraint to include 'ai-full' and 'ai-edited'
--   2. Rename ai_batch_id column to generation_id for API consistency
--   3. Update column comments to reflect new functionality
-- =====================================================================

-- =====================================================================
-- UPDATE SOURCE FIELD CONSTRAINT
-- =====================================================================
-- Drop the existing check constraint on source field
alter table public.flashcards 
drop constraint if exists flashcards_source_check;

-- Add new check constraint with updated source options
-- 'manual' = user-created flashcard
-- 'ai-full' = fully AI-generated flashcard
-- 'ai-edited' = AI-generated flashcard that was edited by user
alter table public.flashcards 
add constraint flashcards_source_check 
check (source in ('manual', 'ai-full', 'ai-edited'));

-- =====================================================================
-- RENAME COLUMN FOR API CONSISTENCY
-- =====================================================================
-- Rename ai_batch_id column to generation_id to match API specification
alter table public.flashcards 
rename column ai_batch_id to generation_id;

-- =====================================================================
-- UPDATE COLUMN COMMENTS
-- =====================================================================
-- Update comments to reflect new functionality and naming
comment on column public.flashcards.generation_id is 
  'Reference to AI generation batch (required for ai-full and ai-edited sources, null for manual)';

comment on column public.flashcards.source is 
  'Origin: manual (user-created), ai-full (AI generated), or ai-edited (AI generated but user modified)';

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
