-- =====================================================================
-- Migration: Create Logging and Analytics Tables
-- =====================================================================
-- Purpose: Create tables for events, audit logs, and security tracking
-- Affected Tables: events (partitioned), audit_log, login_attempts
-- Special Considerations:
--   - events table is RANGE partitioned by month for performance
--   - Initial partition created for current month
--   - Partitions keep data < 10M rows and enable partition pruning
--   - login_attempts used for rate limiting and security monitoring
-- =====================================================================

-- =====================================================================
-- TABLE: events (PARTITIONED)
-- =====================================================================
-- Purpose: Store application events for analytics and user behavior tracking
-- Partitioning Strategy: RANGE by month on logged_at column
-- Retention: 90 days (old partitions dropped by maintenance jobs)
-- Performance: Each partition < 10M rows, allows partition pruning

-- Create parent partitioned table
create table public.events (
  -- Primary key: bigserial for sequential IDs within each partition
  -- Note: Each partition will have its own sequence
  id bigserial not null,
  
  -- User reference: which user triggered this event (nullable for anonymous events)
  user_id uuid references auth.users(id) on delete set null,
  
  -- Event name/type (e.g., "card_created", "review_completed", "session_started")
  -- Max 60 characters for event type identifiers
  name varchar(60) not null,
  
  -- Event metadata: flexible JSON storage for event-specific properties
  -- Examples: {"deck_id": "123", "duration_ms": 5000}
  properties jsonb not null default '{}'::jsonb,
  
  -- Event timestamp: when the event occurred
  -- This column is used for partition key
  logged_at timestamp with time zone not null default now(),
  
  -- Composite primary key: id + logged_at (required for partitioning)
  primary key (id, logged_at)
) partition by range (logged_at);

comment on table public.events is 'Application events for analytics (partitioned by month)';
comment on column public.events.name is 'Event type identifier (e.g., "card_created")';
comment on column public.events.properties is 'Event-specific metadata as JSON';
comment on column public.events.logged_at is 'Event timestamp (partition key)';

-- Create initial partition for January 2026
-- Partitions will be created monthly by maintenance jobs
create table public.events_2026_01 partition of public.events
  for values from ('2026-01-01') to ('2026-02-01');

comment on table public.events_2026_01 is 'Events partition for January 2026';

-- =====================================================================
-- TABLE: audit_log
-- =====================================================================
-- Purpose: Immutable audit trail of data modifications
-- Stores before/after snapshots of changed records for compliance and debugging
-- Typically written by database triggers (to be created in later migration)

create table public.audit_log (
  -- Primary key: bigserial for sequential audit log entries
  id bigserial primary key,
  
  -- User reference: who performed the action (nullable for system actions)
  user_id uuid references auth.users(id) on delete set null,
  
  -- Action type: descriptive action name (e.g., "flashcard.update", "flashcard.delete")
  -- Max 60 characters for action identifiers
  action varchar(60) not null,
  
  -- Object reference: which table was affected (optional)
  -- Example: "flashcards", "review_sessions"
  object_table varchar(60),
  
  -- Object reference: which specific record was affected (optional)
  -- Stores the UUID of the affected row
  object_id uuid,
  
  -- Snapshot: JSON representation of the record before the change
  -- Null for INSERT operations
  before jsonb,
  
  -- Snapshot: JSON representation of the record after the change
  -- Null for DELETE operations
  after jsonb,
  
  -- Audit timestamp: when the action occurred
  logged_at timestamp with time zone not null default now()
);

comment on table public.audit_log is 'Immutable audit trail of data modifications';
comment on column public.audit_log.action is 'Action identifier (e.g., "flashcard.update")';
comment on column public.audit_log.object_table is 'Table name of affected record';
comment on column public.audit_log.object_id is 'UUID of affected record';
comment on column public.audit_log.before is 'JSON snapshot before change (null for INSERT)';
comment on column public.audit_log.after is 'JSON snapshot after change (null for DELETE)';

-- =====================================================================
-- TABLE: login_attempts
-- =====================================================================
-- Purpose: Track authentication attempts for security monitoring and rate limiting
-- Used to detect brute force attacks and implement login throttling
-- Retention: 90 days (old records deleted by maintenance jobs)

create table public.login_attempts (
  -- Primary key: bigserial for sequential log entries
  id bigserial primary key,
  
  -- User identifier: email address attempted
  -- Max 160 characters per email spec
  user_email varchar(160) not null,
  
  -- Network information: IP address of login attempt
  -- inet type supports both IPv4 and IPv6
  ip inet not null,
  
  -- Outcome: whether the login was successful
  success boolean not null,
  
  -- Timestamp: when the attempt occurred
  attempted_at timestamp with time zone not null default now()
);

comment on table public.login_attempts is 'Login attempts log for security monitoring and rate limiting';
comment on column public.login_attempts.user_email is 'Email address attempted';
comment on column public.login_attempts.ip is 'IP address of attempt (IPv4/IPv6)';
comment on column public.login_attempts.success is 'Whether login succeeded';
comment on column public.login_attempts.attempted_at is 'Timestamp of attempt';

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

