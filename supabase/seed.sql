-- =====================================================================
-- Seed Data for Development
-- =====================================================================
-- Purpose: Populate development database with test data
-- This file is automatically run after migrations during db reset
-- Note: Users must register through the normal authentication flow
--       This seed file only contains system configuration
-- =====================================================================

-- =====================================================================
-- System Configuration
-- =====================================================================

-- Set default flashcard limit
insert into public.system_flags (key, value, description)
values (
  'flashcard_limit_per_user',
  '2000'::jsonb,
  'Maximum number of flashcards allowed per user'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description;

-- Set daily review limit
insert into public.system_flags (key, value, description)
values (
  'daily_review_limit',
  '100'::jsonb,
  'Maximum number of flashcards to review per day'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description;

-- =====================================================================
-- END OF SEED DATA
-- =====================================================================


