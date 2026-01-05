-- =====================================================================
-- Migration: Re-enable RLS Policies for Flashcards
-- =====================================================================
-- Purpose: Re-enable Row Level Security policies for flashcards table
--          that were previously disabled
-- Affected Tables: flashcards
-- =====================================================================

-- =====================================================================
-- RE-ENABLE RLS POLICIES: flashcards
-- =====================================================================

-- Drop any existing policies first (idempotent)
drop policy if exists p_flashcards_select_own on public.flashcards;
drop policy if exists p_flashcards_insert_own on public.flashcards;
drop policy if exists p_flashcards_update_own on public.flashcards;
drop policy if exists p_flashcards_delete_own on public.flashcards;

-- Ensure RLS is enabled
alter table public.flashcards enable row level security;

-- authenticated role: SELECT own flashcards
create policy p_flashcards_select_own
  on public.flashcards
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_flashcards_select_own on public.flashcards is
  'Authenticated users can view their own flashcards';

-- authenticated role: INSERT own flashcards
create policy p_flashcards_insert_own
  on public.flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_flashcards_insert_own on public.flashcards is
  'Authenticated users can create flashcards for themselves';

-- authenticated role: UPDATE own flashcards
create policy p_flashcards_update_own
  on public.flashcards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy p_flashcards_update_own on public.flashcards is
  'Authenticated users can update their own flashcards';

-- authenticated role: DELETE own flashcards
create policy p_flashcards_delete_own
  on public.flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy p_flashcards_delete_own on public.flashcards is
  'Authenticated users can delete their own flashcards';

comment on table public.flashcards is 
  'Core flashcard entities with spaced repetition metadata (RLS enabled with policies)';

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

