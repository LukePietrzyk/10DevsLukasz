-- =====================================================================
-- Migration: Create Database Functions and Triggers
-- =====================================================================
-- Purpose: Create PL/pgSQL functions and triggers for business logic
-- Affected: Triggers for timestamps, versioning, full-text search,
--           flashcard limits, spaced repetition algorithm
-- Special Considerations:
--   - Triggers maintain data consistency automatically
--   - answer_flashcard() implements SuperMemo SM-2 algorithm
--   - Full-text search updated automatically via trigger
--   - User flashcard limit enforced via trigger
-- =====================================================================

-- =====================================================================
-- FUNCTION: update_updated_at_column()
-- =====================================================================
-- Purpose: Automatically update updated_at timestamp on row modification
-- Used by: flashcards table
-- Trigger fires: BEFORE UPDATE

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  -- Set updated_at to current timestamp
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.update_updated_at_column() is
  'Trigger function: automatically update updated_at timestamp';

-- =====================================================================
-- FUNCTION: increment_version_column()
-- =====================================================================
-- Purpose: Implement optimistic locking by incrementing version counter
-- Used by: flashcards table
-- Trigger fires: BEFORE UPDATE

create or replace function public.increment_version_column()
returns trigger
language plpgsql
as $$
begin
  -- Increment version for optimistic locking
  new.version = old.version + 1;
  return new;
end;
$$;

comment on function public.increment_version_column() is
  'Trigger function: increment version for optimistic locking';

-- =====================================================================
-- FUNCTION: update_flashcard_fts()
-- =====================================================================
-- Purpose: Maintain full-text search tsvector column
-- Used by: flashcards table (via generated column in next migration)
-- This function prepares for FTS; actual column added separately

create or replace function public.update_flashcard_fts()
returns trigger
language plpgsql
as $$
begin
  -- Generate tsvector from front and back text
  -- Using 'simple' dictionary to avoid language-specific stemming
  -- Concatenate front and back with space separator
  new.fts = to_tsvector('simple', 
    coalesce(new.front, '') || ' ' || coalesce(new.back, '')
  );
  return new;
end;
$$;

comment on function public.update_flashcard_fts() is
  'Trigger function: update full-text search vector';

-- =====================================================================
-- FUNCTION: enforce_flashcard_limit()
-- =====================================================================
-- Purpose: Prevent users from exceeding maximum flashcard count
-- Limit is configurable via system_flags table
-- Trigger fires: BEFORE INSERT on flashcards

create or replace function public.enforce_flashcard_limit()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
  max_allowed integer;
begin
  -- Get maximum allowed from system_flags
  select (value)::integer into max_allowed
  from public.system_flags
  where key = 'max_flashcards_per_user';
  
  -- Default to 2000 if not configured
  max_allowed := coalesce(max_allowed, 2000);
  
  -- Count user's existing flashcards
  select count(*) into current_count
  from public.flashcards
  where user_id = new.user_id;
  
  -- Raise exception if limit exceeded
  if current_count >= max_allowed then
    raise exception 'Flashcard limit exceeded: % of % allowed',
      current_count, max_allowed
      using errcode = 'check_violation',
            hint = 'Delete some flashcards before creating new ones';
  end if;
  
  return new;
end;
$$;

comment on function public.enforce_flashcard_limit() is
  'Trigger function: enforce per-user flashcard limit from system_flags';

-- =====================================================================
-- FUNCTION: answer_flashcard()
-- =====================================================================
-- Purpose: Atomic operation to record flashcard review and update scheduling
-- Implements: SuperMemo SM-2 spaced repetition algorithm
-- Parameters:
--   _flashcard_id: UUID of flashcard being reviewed
--   _difficulty: User's difficulty rating (hard/medium/easy)
--   _client_ts: Client timestamp (optional, for clock skew detection)
--   _response_ms: Response time in milliseconds (optional)
-- Returns: Updated flashcard record with new scheduling

create or replace function public.answer_flashcard(
  _flashcard_id uuid,
  _difficulty public.difficulty_enum,
  _client_ts timestamp with time zone default null,
  _response_ms integer default null
)
returns public.flashcards
language plpgsql
security definer
as $$
declare
  _user_id uuid;
  _current_ease numeric(4,2);
  _current_review_count integer;
  _new_ease numeric(4,2);
  _interval_days integer;
  _result public.flashcards;
  _active_session_id uuid;
begin
  -- Get current user ID
  _user_id := auth.uid();
  
  if _user_id is null then
    raise exception 'Not authenticated'
      using errcode = 'insufficient_privilege';
  end if;
  
  -- Lock the flashcard row for update
  select ease_factor, review_count
  into _current_ease, _current_review_count
  from public.flashcards
  where id = _flashcard_id and user_id = _user_id
  for update;
  
  if not found then
    raise exception 'Flashcard not found or access denied'
      using errcode = 'no_data_found';
  end if;
  
  -- Find active session (if any)
  select id into _active_session_id
  from public.review_sessions
  where user_id = _user_id and status = 'active'
  limit 1;
  
  -- Insert review history record
  insert into public.review_history (
    flashcard_id,
    user_id,
    session_id,
    difficulty,
    client_ts,
    response_ms
  ) values (
    _flashcard_id,
    _user_id,
    _active_session_id,
    _difficulty,
    _client_ts,
    _response_ms
  );
  
  -- ===================================================================
  -- SuperMemo SM-2 Algorithm Implementation
  -- ===================================================================
  
  -- Calculate new ease factor based on difficulty
  case _difficulty
    when 'hard' then
      -- Decrease ease factor by 0.20 (min 1.30)
      _new_ease := greatest(1.30, _current_ease - 0.20);
    when 'medium' then
      -- Decrease ease factor by 0.05 (min 1.30)
      _new_ease := greatest(1.30, _current_ease - 0.05);
    when 'easy' then
      -- Increase ease factor by 0.15
      _new_ease := _current_ease + 0.15;
  end case;
  
  -- Calculate interval based on review count and ease factor
  if _current_review_count = 0 then
    -- First review
    case _difficulty
      when 'hard' then _interval_days := 1;
      when 'medium' then _interval_days := 3;
      when 'easy' then _interval_days := 4;
    end case;
  elsif _current_review_count = 1 then
    -- Second review
    case _difficulty
      when 'hard' then _interval_days := 3;
      when 'medium' then _interval_days := 5;
      when 'easy' then _interval_days := 7;
    end case;
  else
    -- Subsequent reviews: use ease factor
    -- Formula: previous_interval * ease_factor
    -- For hard cards, also reduce by factor of 0.7
    declare
      _previous_interval integer;
    begin
      select extract(day from (next_review_at - last_review_at::date))::integer
      into _previous_interval
      from public.flashcards
      where id = _flashcard_id;
      
      _previous_interval := coalesce(_previous_interval, 7);
      
      if _difficulty = 'hard' then
        _interval_days := greatest(1, round(_previous_interval * _new_ease * 0.7)::integer);
      else
        _interval_days := greatest(1, round(_previous_interval * _new_ease)::integer);
      end if;
    end;
  end if;
  
  -- Update flashcard with new scheduling
  update public.flashcards
  set
    ease_factor = _new_ease,
    review_count = review_count + 1,
    last_review_at = now(),
    next_review_at = current_date + _interval_days
  where id = _flashcard_id
  returning * into _result;
  
  -- Log event for analytics
  insert into public.events (user_id, name, properties)
  values (
    _user_id,
    'flashcard_reviewed',
    jsonb_build_object(
      'flashcard_id', _flashcard_id,
      'difficulty', _difficulty,
      'new_ease_factor', _new_ease,
      'interval_days', _interval_days,
      'response_ms', _response_ms
    )
  );
  
  return _result;
end;
$$;

comment on function public.answer_flashcard(uuid, public.difficulty_enum, timestamp with time zone, integer) is
  'Atomic operation: record review and update flashcard scheduling (SM-2 algorithm)';

-- =====================================================================
-- ATTACH TRIGGERS TO TABLES
-- =====================================================================

-- flashcards: update updated_at on modification
create trigger trg_flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();

comment on trigger trg_flashcards_updated_at on public.flashcards is
  'Automatically update updated_at timestamp';

-- flashcards: increment version on modification (optimistic locking)
create trigger trg_flashcards_version
  before update on public.flashcards
  for each row
  execute function public.increment_version_column();

comment on trigger trg_flashcards_version on public.flashcards is
  'Increment version for optimistic locking';

-- flashcards: enforce per-user flashcard limit
create trigger trg_flashcards_limit
  before insert on public.flashcards
  for each row
  execute function public.enforce_flashcard_limit();

comment on trigger trg_flashcards_limit on public.flashcards is
  'Enforce maximum flashcards per user';

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

