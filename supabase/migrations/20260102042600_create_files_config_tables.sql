-- =====================================================================
-- Migration: Create Files and Configuration Tables
-- =====================================================================
-- Purpose: Create tables for file attachments and system configuration
-- Affected Tables: files, system_flags
-- Special Considerations:
--   - files table tracks uploaded media/attachments
--   - checksum ensures deduplication of identical files
--   - system_flags provides flexible key-value configuration storage
-- =====================================================================

-- =====================================================================
-- TABLE: files
-- =====================================================================
-- Purpose: Track uploaded files and attachments
-- Supports future features like image flashcards, audio pronunciation, etc.
-- Deduplication via checksum ensures storage efficiency

create table public.files (
  -- Primary key: UUID v7 for time-ordered IDs
  id uuid primary key default public.uuid_generate_v7(),
  
  -- Owner reference: which user uploaded this file
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- File metadata: original filename
  -- Max 160 characters to accommodate long filenames
  name varchar(160) not null,
  
  -- File metadata: MIME type (e.g., "image/png", "audio/mpeg")
  -- Max 80 characters for MIME type strings
  mime_type varchar(80) not null,
  
  -- File metadata: size in bytes
  size_bytes integer not null,
  
  -- File integrity: SHA-256 checksum (64 hex characters)
  -- UNIQUE constraint enables deduplication of identical files
  checksum char(64) not null unique,
  
  -- Storage reference: path to file in storage bucket
  -- Used to retrieve file from Supabase Storage or similar
  storage_path text not null,
  
  -- Audit field: when file was uploaded
  created_at timestamp with time zone not null default now()
);

comment on table public.files is 'Uploaded files and attachments with deduplication';
comment on column public.files.name is 'Original filename';
comment on column public.files.mime_type is 'MIME type (e.g., "image/png")';
comment on column public.files.size_bytes is 'File size in bytes';
comment on column public.files.checksum is 'SHA-256 checksum for deduplication';
comment on column public.files.storage_path is 'Path in storage bucket';

-- =====================================================================
-- TABLE: system_flags
-- =====================================================================
-- Purpose: Flexible key-value store for system configuration and feature flags
-- Allows runtime configuration without code deployment
-- Examples: {"max_flashcards_per_user": 2000}, {"maintenance_mode": true}

create table public.system_flags (
  -- Primary key: configuration key (e.g., "max_flashcards_per_user")
  key varchar(60) primary key,
  
  -- Configuration value: flexible JSON storage
  -- Can store strings, numbers, booleans, arrays, or objects
  value jsonb not null,
  
  -- Documentation: human-readable description of what this flag does
  description text
);

comment on table public.system_flags is 'System configuration and feature flags (key-value store)';
comment on column public.system_flags.key is 'Configuration key identifier';
comment on column public.system_flags.value is 'Configuration value (JSON)';
comment on column public.system_flags.description is 'Human-readable description';

-- =====================================================================
-- INITIAL CONFIGURATION DATA
-- =====================================================================
-- Insert default system configuration values

-- Maximum number of flashcards per user (referenced in triggers)
insert into public.system_flags (key, value, description)
values (
  'max_flashcards_per_user',
  '2000'::jsonb,
  'Maximum number of flashcards a single user can create'
);

-- Feature flag: AI generation enabled
insert into public.system_flags (key, value, description)
values (
  'ai_generation_enabled',
  'false'::jsonb,
  'Whether AI flashcard generation is enabled (Phase 2)'
);

-- Feature flag: Decks enabled
insert into public.system_flags (key, value, description)
values (
  'decks_enabled',
  'false'::jsonb,
  'Whether deck organization is enabled (Phase 2)'
);

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

