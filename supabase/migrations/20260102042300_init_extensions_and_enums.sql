-- =====================================================================
-- Migration: Initialize Extensions and Enumerations
-- =====================================================================
-- Purpose: Set up required PostgreSQL extensions and create custom enums
--          for the flashcard application
-- Affected: Extensions (uuid-ossp), Custom Types (enums), UUID v7 function
-- Special Considerations: Custom UUID v7 implementation for better index locality
-- =====================================================================

-- =====================================================================
-- EXTENSIONS
-- =====================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp" schema extensions;

-- Note: pg_uuidv7 extension is not available in standard Supabase
-- We'll create our own UUID v7 implementation function instead

-- =====================================================================
-- ENUMERATIONS
-- =====================================================================

-- difficulty_enum: Represents the user's self-reported difficulty level
-- when answering a flashcard during review sessions
-- Values map to SuperMemo SM-2 algorithm difficulty levels:
-- - hard: User struggled significantly (lower ease factor adjustment)
-- - medium: User recalled with some effort (moderate adjustment)
-- - easy: User recalled effortlessly (higher ease factor adjustment)
create type public.difficulty_enum as enum ('hard', 'medium', 'easy');

-- review_session_status_enum: Tracks the lifecycle state of a review session
-- - active: Session is currently in progress (user is reviewing cards)
-- - completed: Session was finished normally by the user
-- - aborted: Session was interrupted or abandoned before completion
create type public.review_session_status_enum as enum ('active', 'completed', 'aborted');

-- =====================================================================
-- CUSTOM UUID V7 FUNCTION
-- =====================================================================

-- uuid_generate_v7: Custom implementation of UUID v7
-- UUID v7 embeds timestamp in the UUID, providing:
-- - Better index locality compared to random UUIDs
-- - Natural chronological ordering
-- - Time-based sortability
--
-- Format (RFC draft):
-- - 48 bits: Unix timestamp in milliseconds
-- - 12 bits: Random data for sub-millisecond ordering
-- - 62 bits: Random data
-- - 6 bits: Version (0b0111) and variant (0b10) markers

create or replace function public.uuid_generate_v7()
returns uuid
language plpgsql
volatile
as $$
declare
  unix_ts_ms bigint;
  uuid_bytes bytea;
begin
  -- Get current Unix timestamp in milliseconds
  unix_ts_ms := floor(extract(epoch from clock_timestamp()) * 1000);
  
  -- Generate UUID v7
  uuid_bytes := 
    -- 48-bit timestamp (6 bytes)
    substring(int8send(unix_ts_ms) from 3 for 6) ||
    -- 12-bit random + 4-bit version (2 bytes)
    -- Set version to 7 (0b0111xxxx xxxxxxxx)
    substring(bytea '\x70' || gen_random_bytes(1) from 1 for 2) ||
    -- 2-bit variant + 62-bit random (8 bytes)
    -- Set variant to 10 (0b10xxxxxx xxxxxxxx ...)
    substring(set_byte(gen_random_bytes(8), 0, (get_byte(gen_random_bytes(1), 0) & 63) | 128) from 1 for 8);
  
  return encode(uuid_bytes, 'hex')::uuid;
end;
$$;

comment on function public.uuid_generate_v7() is
  'Generate UUID v7 with embedded timestamp for better index locality';

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

