-- =====================================================================
-- Migration: Disable RLS Policies for Flashcards
-- =====================================================================
-- Purpose: Disable Row Level Security policies for specified tables
-- Affected Tables: flashcards
-- Note: Tables 'generations' and 'generation_error_log' do not exist
--       in the current schema, so no policies to disable for them
-- =====================================================================

-- =====================================================================
-- DISABLE RLS POLICIES: flashcards
-- =====================================================================

-- Drop all RLS policies for flashcards table
drop policy if exists p_flashcards_select_own on public.flashcards;
drop policy if exists p_flashcards_insert_own on public.flashcards;
drop policy if exists p_flashcards_update_own on public.flashcards;
drop policy if exists p_flashcards_delete_own on public.flashcards;

-- Optionally disable RLS entirely on the table
-- Uncomment the following line if you want to completely disable RLS:
-- alter table public.flashcards disable row level security;

comment on table public.flashcards is 
  'Core flashcard entities with spaced repetition metadata (RLS policies disabled)';

-- =====================================================================
-- NOTE: Non-existent Tables
-- =====================================================================
-- The following tables were requested but do not exist in the schema:
--   - generations
--   - generation_error_log
-- 
-- If these tables are created in the future, add DROP POLICY statements
-- for them in a subsequent migration.
-- =====================================================================

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

