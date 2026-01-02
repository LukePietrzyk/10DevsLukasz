-- =====================================================================
-- Migration: Enable Row Level Security and Create Policies
-- =====================================================================
-- Purpose: Enable RLS on all tables and create security policies
-- Affected: All domain tables with user_id column
-- Special Considerations:
--   - RLS must be enabled even for public tables
--   - Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
--   - Separate policies for each role (anon, authenticated)
--   - Analytics tables readable by analytics role
--   - System tables have special access rules
-- =====================================================================

-- =====================================================================
-- RLS POLICIES: flashcards
-- =====================================================================

alter table public.flashcards enable row level security;

-- anon role: no access to flashcards
-- (Anonymous users must sign up/login to use flashcards)

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

-- =====================================================================
-- RLS POLICIES: review_history
-- =====================================================================

alter table public.review_history enable row level security;

-- authenticated role: SELECT own review history
create policy p_review_history_select_own
  on public.review_history
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_review_history_select_own on public.review_history is
  'Authenticated users can view their own review history';

-- authenticated role: INSERT own reviews
-- Note: In practice, reviews should be created via answer_flashcard() function
create policy p_review_history_insert_own
  on public.review_history
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_review_history_insert_own on public.review_history is
  'Authenticated users can create review records for themselves';

-- No UPDATE or DELETE policies: review history is immutable

-- =====================================================================
-- RLS POLICIES: review_sessions
-- =====================================================================

alter table public.review_sessions enable row level security;

-- authenticated role: SELECT own sessions
create policy p_review_sessions_select_own
  on public.review_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_review_sessions_select_own on public.review_sessions is
  'Authenticated users can view their own review sessions';

-- authenticated role: INSERT own sessions
create policy p_review_sessions_insert_own
  on public.review_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_review_sessions_insert_own on public.review_sessions is
  'Authenticated users can create review sessions for themselves';

-- authenticated role: UPDATE own sessions
create policy p_review_sessions_update_own
  on public.review_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy p_review_sessions_update_own on public.review_sessions is
  'Authenticated users can update their own review sessions';

-- authenticated role: DELETE own sessions
create policy p_review_sessions_delete_own
  on public.review_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy p_review_sessions_delete_own on public.review_sessions is
  'Authenticated users can delete their own review sessions';

-- =====================================================================
-- RLS POLICIES: flashcard_favourites
-- =====================================================================

alter table public.flashcard_favourites enable row level security;

-- authenticated role: SELECT own favourites
create policy p_flashcard_favourites_select_own
  on public.flashcard_favourites
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_flashcard_favourites_select_own on public.flashcard_favourites is
  'Authenticated users can view their own favourites';

-- authenticated role: INSERT own favourites
create policy p_flashcard_favourites_insert_own
  on public.flashcard_favourites
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_flashcard_favourites_insert_own on public.flashcard_favourites is
  'Authenticated users can add cards to their favourites';

-- authenticated role: DELETE own favourites
create policy p_flashcard_favourites_delete_own
  on public.flashcard_favourites
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy p_flashcard_favourites_delete_own on public.flashcard_favourites is
  'Authenticated users can remove cards from their favourites';

-- =====================================================================
-- RLS POLICIES: ai_batches
-- =====================================================================

alter table public.ai_batches enable row level security;

-- authenticated role: SELECT own AI batches
create policy p_ai_batches_select_own
  on public.ai_batches
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_ai_batches_select_own on public.ai_batches is
  'Authenticated users can view their own AI batches';

-- authenticated role: INSERT own AI batches
create policy p_ai_batches_insert_own
  on public.ai_batches
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_ai_batches_insert_own on public.ai_batches is
  'Authenticated users can create AI batches for themselves';

-- authenticated role: UPDATE own AI batches
create policy p_ai_batches_update_own
  on public.ai_batches
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy p_ai_batches_update_own on public.ai_batches is
  'Authenticated users can update their own AI batches';

-- authenticated role: DELETE own AI batches
create policy p_ai_batches_delete_own
  on public.ai_batches
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy p_ai_batches_delete_own on public.ai_batches is
  'Authenticated users can delete their own AI batches';

-- =====================================================================
-- RLS POLICIES: decks
-- =====================================================================

alter table public.decks enable row level security;

-- authenticated role: SELECT own decks
create policy p_decks_select_own
  on public.decks
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_decks_select_own on public.decks is
  'Authenticated users can view their own decks';

-- authenticated role: INSERT own decks
create policy p_decks_insert_own
  on public.decks
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_decks_insert_own on public.decks is
  'Authenticated users can create decks for themselves';

-- authenticated role: UPDATE own decks
create policy p_decks_update_own
  on public.decks
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy p_decks_update_own on public.decks is
  'Authenticated users can update their own decks';

-- authenticated role: DELETE own decks
create policy p_decks_delete_own
  on public.decks
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy p_decks_delete_own on public.decks is
  'Authenticated users can delete their own decks';

-- =====================================================================
-- RLS POLICIES: files
-- =====================================================================

alter table public.files enable row level security;

-- authenticated role: SELECT own files
create policy p_files_select_own
  on public.files
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_files_select_own on public.files is
  'Authenticated users can view their own files';

-- authenticated role: INSERT own files
create policy p_files_insert_own
  on public.files
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_files_insert_own on public.files is
  'Authenticated users can upload files for themselves';

-- authenticated role: DELETE own files
create policy p_files_delete_own
  on public.files
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy p_files_delete_own on public.files is
  'Authenticated users can delete their own files';

-- =====================================================================
-- RLS POLICIES: events
-- =====================================================================

alter table public.events enable row level security;

-- authenticated role: SELECT own events
create policy p_events_select_own
  on public.events
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_events_select_own on public.events is
  'Authenticated users can view their own events';

-- authenticated role: INSERT own events
create policy p_events_insert_own
  on public.events
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy p_events_insert_own on public.events is
  'Authenticated users can create events for themselves';

-- No UPDATE or DELETE policies: events are immutable

-- =====================================================================
-- RLS POLICIES: audit_log
-- =====================================================================

alter table public.audit_log enable row level security;

-- authenticated role: SELECT own audit records
create policy p_audit_log_select_own
  on public.audit_log
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy p_audit_log_select_own on public.audit_log is
  'Authenticated users can view their own audit records';

-- No INSERT/UPDATE/DELETE policies: audit log written by triggers only
-- service_role can write directly (bypasses RLS)

-- =====================================================================
-- RLS POLICIES: login_attempts
-- =====================================================================

alter table public.login_attempts enable row level security;

-- No policies for regular users: login_attempts is security-sensitive
-- Only service_role (backend) can read/write login attempts
-- This prevents users from tampering with rate limiting data

comment on table public.login_attempts is
  'RLS enabled but no policies: service_role only (rate limiting data)';

-- =====================================================================
-- RLS POLICIES: system_flags
-- =====================================================================

alter table public.system_flags enable row level security;

-- anon role: SELECT all system flags (read-only configuration)
create policy p_system_flags_select_anon
  on public.system_flags
  for select
  to anon
  using (true);

comment on policy p_system_flags_select_anon on public.system_flags is
  'Anonymous users can read system configuration';

-- authenticated role: SELECT all system flags
create policy p_system_flags_select_authenticated
  on public.system_flags
  for select
  to authenticated
  using (true);

comment on policy p_system_flags_select_authenticated on public.system_flags is
  'Authenticated users can read system configuration';

-- No INSERT/UPDATE/DELETE policies for regular users
-- Configuration changes require service_role (admin access)

-- =====================================================================
-- GRANT STATEMENTS
-- =====================================================================

-- Grant necessary permissions to authenticated role
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- Grant necessary permissions to anon role (read-only where allowed)
grant usage on schema public to anon;
grant select on public.system_flags to anon;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

