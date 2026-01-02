-- =====================================================================
-- Migration: Partition Management Functions
-- =====================================================================
-- Purpose: Create helper functions for managing table partitions
-- Affected: events table (partitioned)
-- Special Considerations:
--   - Functions for creating future partitions automatically
--   - Functions for dropping old partitions (data retention)
--   - Should be called by cron jobs or maintenance scripts
-- =====================================================================

-- =====================================================================
-- FUNCTION: create_monthly_partition()
-- =====================================================================
-- Purpose: Create a new monthly partition for events table
-- Parameters:
--   partition_date: First day of the month for the partition
-- Usage: Call at start of each month to create next month's partition

create or replace function public.create_monthly_partition(
  partition_date date
)
returns text
language plpgsql
security definer
as $$
declare
  partition_name text;
  start_date date;
  end_date date;
  partition_exists boolean;
begin
  -- Normalize to first day of month
  start_date := date_trunc('month', partition_date)::date;
  end_date := (start_date + interval '1 month')::date;
  
  -- Generate partition name: events_YYYY_MM
  partition_name := 'events_' || to_char(start_date, 'YYYY_MM');
  
  -- Check if partition already exists
  select exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
    and c.relname = partition_name
  ) into partition_exists;
  
  if partition_exists then
    return 'Partition ' || partition_name || ' already exists';
  end if;
  
  -- Create partition
  execute format(
    'create table public.%I partition of public.events for values from (%L) to (%L)',
    partition_name,
    start_date,
    end_date
  );
  
  return 'Created partition ' || partition_name || ' for period ' || 
         start_date::text || ' to ' || end_date::text;
end;
$$;

comment on function public.create_monthly_partition(date) is
  'Create monthly partition for events table';

-- =====================================================================
-- FUNCTION: drop_old_partitions()
-- =====================================================================
-- Purpose: Drop event partitions older than specified retention period
-- Parameters:
--   retention_days: Number of days to retain (default 90)
-- Returns: Number of partitions dropped
-- Usage: Call periodically to enforce data retention policy

create or replace function public.drop_old_partitions(
  retention_days integer default 90
)
returns integer
language plpgsql
security definer
as $$
declare
  partition_record record;
  cutoff_date date;
  dropped_count integer := 0;
begin
  -- Calculate cutoff date
  cutoff_date := current_date - retention_days;
  
  -- Find and drop old partitions
  for partition_record in
    select
      c.relname as partition_name
    from pg_class c
    join pg_inherits i on i.inhrelid = c.oid
    join pg_class parent on parent.oid = i.inhparent
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
    and parent.relname = 'events'
    and c.relname like 'events_%'
  loop
    -- Extract date from partition name (events_YYYY_MM)
    declare
      partition_month date;
      year_part text;
      month_part text;
    begin
      -- Parse YYYY_MM from partition name
      year_part := substring(partition_record.partition_name from 'events_(\d{4})_\d{2}');
      month_part := substring(partition_record.partition_name from 'events_\d{4}_(\d{2})');
      
      if year_part is not null and month_part is not null then
        partition_month := make_date(year_part::integer, month_part::integer, 1);
        
        -- Drop if older than retention period
        if partition_month < cutoff_date then
          execute format('drop table if exists public.%I', partition_record.partition_name);
          dropped_count := dropped_count + 1;
          
          raise notice 'Dropped partition % (month: %)',
            partition_record.partition_name, partition_month;
        end if;
      end if;
    exception
      when others then
        raise warning 'Error processing partition %: %',
          partition_record.partition_name, sqlerrm;
    end;
  end loop;
  
  return dropped_count;
end;
$$;

comment on function public.drop_old_partitions(integer) is
  'Drop event partitions older than retention period (default 90 days)';

-- =====================================================================
-- FUNCTION: create_future_partitions()
-- =====================================================================
-- Purpose: Create partitions for upcoming months
-- Parameters:
--   months_ahead: Number of months to create (default 3)
-- Returns: Array of created partition names
-- Usage: Run monthly to ensure partitions exist for future data

create or replace function public.create_future_partitions(
  months_ahead integer default 3
)
returns text[]
language plpgsql
security definer
as $$
declare
  created_partitions text[] := array[]::text[];
  current_month date;
  i integer;
  result text;
begin
  current_month := date_trunc('month', current_date)::date;
  
  -- Create partitions for next N months
  for i in 1..months_ahead loop
    result := public.create_monthly_partition(
      (current_month + (i || ' months')::interval)::date
    );
    created_partitions := array_append(created_partitions, result);
  end loop;
  
  return created_partitions;
end;
$$;

comment on function public.create_future_partitions(integer) is
  'Create event partitions for upcoming months';

-- =====================================================================
-- FUNCTION: partition_maintenance()
-- =====================================================================
-- Purpose: Combined maintenance function - create future, drop old
-- This is the main function to call from cron jobs
-- Parameters:
--   retention_days: Days to retain old partitions (default 90)
--   months_ahead: Months to create ahead (default 3)
-- Returns: JSONB summary of actions taken

create or replace function public.partition_maintenance(
  retention_days integer default 90,
  months_ahead integer default 3
)
returns jsonb
language plpgsql
security definer
as $$
declare
  dropped_count integer;
  created_partitions text[];
  result jsonb;
begin
  -- Drop old partitions
  dropped_count := public.drop_old_partitions(retention_days);
  
  -- Create future partitions
  created_partitions := public.create_future_partitions(months_ahead);
  
  -- Build result
  result := jsonb_build_object(
    'timestamp', now(),
    'dropped_partitions', dropped_count,
    'created_partitions', created_partitions,
    'retention_days', retention_days,
    'months_ahead', months_ahead
  );
  
  return result;
end;
$$;

comment on function public.partition_maintenance(integer, integer) is
  'Maintenance function: drop old partitions and create future ones';

-- =====================================================================
-- CREATE INITIAL FUTURE PARTITIONS
-- =====================================================================
-- Create partitions for next 3 months to ensure smooth operation

select public.create_future_partitions(3);

-- =====================================================================
-- USAGE NOTES
-- =====================================================================
-- Schedule partition_maintenance() to run monthly via pg_cron or external scheduler:
--
-- Example pg_cron setup (requires pg_cron extension):
-- SELECT cron.schedule(
--   'monthly-partition-maintenance',
--   '0 2 1 * *',  -- 2 AM on first day of each month
--   $$SELECT public.partition_maintenance()$$
-- );
-- =====================================================================

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

