-- =====================================================================
-- Migration: Create Performance Indexes
-- =====================================================================
-- Purpose: Create indexes for query performance optimization
-- Affected Tables: flashcards, review_history, review_sessions, events,
--                  login_attempts, files, flashcard_favourites
-- Special Considerations:
--   - Indexes match common query patterns from the application
--   - Partial indexes reduce index size and improve write performance
--   - Composite indexes support multi-column queries
--   - GIN index for full-text search on flashcards
-- =====================================================================

-- =====================================================================
-- INDEXES: flashcards
-- =====================================================================

-- Composite index: Query flashcards due for review
-- Supports: SELECT WHERE user_id = ? AND next_review_at <= CURRENT_DATE ORDER BY id
-- This is the primary query for the review flow
create index idx_flashcards_user_next
  on public.flashcards (user_id, next_review_at, id);

comment on index public.idx_flashcards_user_next is 
  'Composite index for finding due flashcards by user and review date';

-- NOTE: Partial index with current_date removed due to IMMUTABLE requirement
-- The composite index idx_flashcards_user_next above is sufficient
-- Application can filter on next_review_at <= CURRENT_DATE in queries

-- Partial index: Subject filtering
-- Supports: SELECT WHERE subject = ? AND user_id = ?
-- Partial index only includes cards that have a subject
create index idx_flashcards_subject_partial
  on public.flashcards (subject)
  where subject is not null;

comment on index public.idx_flashcards_subject_partial is
  'Partial index for subject filtering (only non-null subjects)';

-- Index: AI batch lookup
-- Supports: SELECT WHERE ai_batch_id = ?
-- Used to find all cards generated in a specific AI batch
create index idx_flashcards_ai_batch
  on public.flashcards (ai_batch_id)
  where ai_batch_id is not null;

comment on index public.idx_flashcards_ai_batch is
  'Index for finding cards by AI batch (partial: non-null only)';

-- =====================================================================
-- INDEXES: review_history
-- =====================================================================

-- Index: Flashcard review history lookup
-- Supports: SELECT WHERE flashcard_id = ? ORDER BY answered_at DESC
-- Used to show review history for a specific card
create index idx_review_history_flashcard
  on public.review_history (flashcard_id, answered_at desc);

comment on index public.idx_review_history_flashcard is
  'Index for flashcard review history lookup';

-- Composite index: User review history with time ordering
-- Supports: SELECT WHERE user_id = ? ORDER BY answered_at DESC
-- Used for user activity feeds and statistics
create index idx_review_history_user_time
  on public.review_history (user_id, answered_at desc);

comment on index public.idx_review_history_user_time is
  'Composite index for user review history ordered by time';

-- Index: Session review lookup
-- Supports: SELECT WHERE session_id = ?
-- Used to analyze reviews within a specific session
create index idx_review_history_session
  on public.review_history (session_id)
  where session_id is not null;

comment on index public.idx_review_history_session is
  'Index for finding reviews by session (partial: non-null only)';

-- =====================================================================
-- INDEXES: review_sessions
-- =====================================================================

-- Index: User sessions lookup
-- Supports: SELECT WHERE user_id = ? ORDER BY started_at DESC
-- Used to show user's session history
create index idx_review_sessions_user_time
  on public.review_sessions (user_id, started_at desc);

comment on index public.idx_review_sessions_user_time is
  'Index for user session history ordered by time';

-- Partial unique index: Enforce single active session per user
-- Prevents user from having multiple concurrent active sessions
-- Unique partial index provides both constraint and query optimization
create unique index uidx_active_session
  on public.review_sessions (user_id)
  where status = 'active';

comment on index public.uidx_active_session is
  'Unique partial index: one active session per user';

-- =====================================================================
-- INDEXES: events (partitioned table)
-- =====================================================================

-- Composite index: User events with time ordering
-- Supports: SELECT WHERE user_id = ? ORDER BY logged_at DESC
-- Must be created on parent table (inherited by all partitions)
create index idx_events_user_time
  on public.events (user_id, logged_at desc);

comment on index public.idx_events_user_time is
  'Composite index for user events ordered by time';

-- Index: Event name filtering
-- Supports: SELECT WHERE name = ?
-- Used for event type analytics
create index idx_events_name
  on public.events (name, logged_at desc);

comment on index public.idx_events_name is
  'Index for filtering events by name/type';

-- =====================================================================
-- INDEXES: login_attempts
-- =====================================================================

-- Composite index: Rate limiting by email
-- Supports: SELECT WHERE user_email = ? AND attempted_at > (now() - interval '15 minutes')
-- Used to count recent failed login attempts
create index idx_login_attempts_email_time
  on public.login_attempts (user_email, attempted_at desc);

comment on index public.idx_login_attempts_email_time is
  'Composite index for rate limiting by email';

-- Composite index: Rate limiting by IP
-- Supports: SELECT WHERE ip = ? AND attempted_at > (now() - interval '15 minutes')
-- Used to detect distributed brute force attacks
create index idx_login_attempts_ip_time
  on public.login_attempts (ip, attempted_at desc);

comment on index public.idx_login_attempts_ip_time is
  'Composite index for rate limiting by IP address';

-- =====================================================================
-- INDEXES: audit_log
-- =====================================================================

-- Index: User activity audit trail
-- Supports: SELECT WHERE user_id = ? ORDER BY logged_at DESC
create index idx_audit_log_user_time
  on public.audit_log (user_id, logged_at desc);

comment on index public.idx_audit_log_user_time is
  'Index for user activity audit trail';

-- Index: Object audit trail
-- Supports: SELECT WHERE object_table = ? AND object_id = ?
-- Used to show history of changes to a specific record
create index idx_audit_log_object
  on public.audit_log (object_table, object_id, logged_at desc);

comment on index public.idx_audit_log_object is
  'Index for object audit trail';

-- =====================================================================
-- INDEXES: ai_batches
-- =====================================================================

-- Index: User's AI batches
-- Supports: SELECT WHERE user_id = ? ORDER BY requested_at DESC
create index idx_ai_batches_user_time
  on public.ai_batches (user_id, requested_at desc);

comment on index public.idx_ai_batches_user_time is
  'Index for user AI batch history';

-- Index: Pending batches for processing
-- Supports: SELECT WHERE status = 'pending'
-- Used by background workers to find batches to process
create index idx_ai_batches_status
  on public.ai_batches (status, requested_at)
  where status in ('pending', 'processing');

comment on index public.idx_ai_batches_status is
  'Partial index for pending/processing AI batches';

-- =====================================================================
-- INDEXES: flashcard_favourites
-- =====================================================================

-- Index: Find favourites by flashcard
-- Supports: SELECT WHERE flashcard_id = ?
-- Primary key already covers (user_id, flashcard_id)
create index idx_flashcard_favourites_card
  on public.flashcard_favourites (flashcard_id);

comment on index public.idx_flashcard_favourites_card is
  'Index for finding users who favourited a card';

-- =====================================================================
-- INDEXES: decks
-- =====================================================================

-- Index: User's decks
-- Supports: SELECT WHERE user_id = ? ORDER BY created_at DESC
create index idx_decks_user_time
  on public.decks (user_id, created_at desc);

comment on index public.idx_decks_user_time is
  'Index for user deck list ordered by creation time';

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

