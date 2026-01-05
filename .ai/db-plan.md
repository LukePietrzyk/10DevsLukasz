# Database Schema Plan (PostgreSQL / Supabase)

## 1. Tables, Columns & Constraints

### 1.1 Enumerations

- `difficulty_enum` (`hard`, `medium`, `easy`)
- `review_session_status_enum` (`active`, `completed`, `aborted`)

### 1.2 Core Domain

| Table          | Column         | Type                       | Constraints                                          | Default              |
| -------------- | -------------- | -------------------------- | ---------------------------------------------------- | -------------------- |
| **flashcards** | id             | `uuid`                     | PK                                                   | `uuid_generate_v7()` |
|                | user_id        | `uuid`                     | FK → `auth.users(id)`, NOT NULL                      |                      |
|                | front          | `varchar(120)`             | NOT NULL                                             |                      |
|                | back           | `varchar(300)`             | NOT NULL                                             |                      |
|                | subject        | `varchar(40)`              |                                                      |                      |
|                | next_review_at | `date`                     | NOT NULL                                             | `current_date`       |
|                | last_review_at | `timestamp with time zone` |                                                      |                      |
|                | review_count   | `integer`                  | NOT NULL                                             | `0`                  |
|                | ease_factor    | `numeric(4,2)`             | NOT NULL                                             | `2.50`               |
|                | source         | `text`                     | CHECK (`source IN ('manual','ai-full','ai-edited')`) | `'manual'`           |
|                | generation_id  | `uuid`                     | FK → `ai_batches(id)`, NULLABLE                      |                      |
|                | created_at     | `timestamp with time zone` | NOT NULL                                             | `now()`              |
|                | updated_at     | `timestamp with time zone` | NOT NULL                                             | `now()`              |
|                | version        | `integer`                  | NOT NULL                                             | `1`                  |

| Table              | Column       | Type                       | Constraints                                       | Default              |
| ------------------ | ------------ | -------------------------- | ------------------------------------------------- | -------------------- |
| **review_history** | id           | `uuid`                     | PK                                                | `uuid_generate_v7()` |
|                    | flashcard_id | `uuid`                     | FK → `flashcards(id)` ON DELETE CASCADE, NOT NULL |                      |
|                    | user_id      | `uuid`                     | FK → `auth.users(id)`, NOT NULL                   |                      |
|                    | session_id   | `uuid`                     | FK → `review_sessions(id)`                        |                      |
|                    | difficulty   | `difficulty_enum`          | NOT NULL                                          |                      |
|                    | answered_at  | `timestamp with time zone` | NOT NULL                                          | `now()`              |
|                    | client_ts    | `timestamp with time zone` |                                                   |                      |
|                    | response_ms  | `integer`                  | CHECK (response_ms >= 0)                          |                      |

| **review_sessions** | id | `uuid` | PK | `uuid_generate_v7()` |
| | user_id | `uuid` | FK → `auth.users(id)`, NOT NULL | |
| | started_at | `timestamp with time zone` | NOT NULL | `now()` |
| | finished_at | `timestamp with time zone` | | |
| | status | `review_session_status_enum` | NOT NULL | `'active'` |

### 1.3 Logging & Analytics

| Table                                                 | Column     | Type                       | Constraints           | Default |
| ----------------------------------------------------- | ---------- | -------------------------- | --------------------- | ------- |
| **events** (partitioned BY RANGE `logged_at` monthly) | id         | `bigserial`                | PK                    |         |
|                                                       | user_id    | `uuid`                     | FK → `auth.users(id)` |         |
|                                                       | name       | `varchar(60)`              | NOT NULL              |         |
|                                                       | properties | `jsonb`                    |                       | `'{}'`  |
|                                                       | logged_at  | `timestamp with time zone` | NOT NULL              | `now()` |

| **audit_log** | id | `bigserial` | PK | |
| | user_id | `uuid` | FK → `auth.users(id)` | |
| | action | `varchar(60)` | NOT NULL | |
| | object_table | `varchar(60)` | | |
| | object_id | `uuid` | | |
| | before | `jsonb` | | |
| | after | `jsonb` | | |
| | logged_at | `timestamp with time zone` | NOT NULL | `now()` |

| **login_attempts** | id | `bigserial` | PK | |
| | user_email | `varchar(160)` | NOT NULL | |
| | ip | `inet` | NOT NULL | |
| | success | `boolean` | NOT NULL | |
| | attempted_at | `timestamp with time zone` | NOT NULL | `now()` |

### 1.4 Attachments & Media

| Table     | Column       | Type                       | Constraints                     | Default              |
| --------- | ------------ | -------------------------- | ------------------------------- | -------------------- |
| **files** | id           | `uuid`                     | PK                              | `uuid_generate_v7()` |
|           | user_id      | `uuid`                     | FK → `auth.users(id)`, NOT NULL |                      |
|           | name         | `varchar(160)`             | NOT NULL                        |                      |
|           | mime_type    | `varchar(80)`              | NOT NULL                        |                      |
|           | size_bytes   | `integer`                  | NOT NULL                        |                      |
|           | checksum     | `char(64)`                 | UNIQUE, NOT NULL                |                      |
|           | storage_path | `text`                     | NOT NULL                        |                      |
|           | created_at   | `timestamp with time zone` | NOT NULL                        | `now()`              |

### 1.5 Configuration & Helpers

| Table            | Column      | Type          | Constraints | Default |
| ---------------- | ----------- | ------------- | ----------- | ------- |
| **system_flags** | key         | `varchar(60)` | PK          |         |
|                  | value       | `jsonb`       | NOT NULL    |         |
|                  | description | `text`        |             |         |

| **flashcard_favourites** | user_id | `uuid` | FK → `auth.users(id)`, NOT NULL | |
| | flashcard_id | `uuid` | FK → `flashcards(id)` ON DELETE CASCADE, NOT NULL | |
| | added_at | `timestamp with time zone` | NOT NULL | `now()` |
| PRIMARY KEY (`user_id`, `flashcard_id`) |

| **decks** _(placeholder for Phase 2)_ | id | `uuid` | PK | `uuid_generate_v7()` |
| | user_id | `uuid` | FK → `auth.users(id)` | |
| | name | `varchar(80)` | NOT NULL | |
| | created_at | `timestamp with time zone` | NOT NULL | `now()` |

| **ai_batches** _(placeholder for Phase 2)_ | id | `uuid` | PK | `uuid_generate_v7()` |
| | user_id | `uuid` | FK → `auth.users(id)` | |
| | model | `varchar(120)` | NOT NULL | |
| | status | `varchar(40)` | NOT NULL | `'pending'` |
| | requested_at | `timestamp with time zone` | NOT NULL | `now()` |

## 2. Relationships & Cardinality

- `users (auth.users)` 1 — N `flashcards`
- `flashcards` 1 — N `review_history`
- `users` 1 — N `review_history`
- `users` 1 — N `review_sessions`
- `review_sessions` 1 — N `review_history`
- `flashcards` N — N `users` via `flashcard_favourites`
- `ai_batches` 1 — N `flashcards` via `generation_id` (optional, Phase 2)

## 3. Indexes

1. `flashcards`  
   • PK on `id` (btree)  
   • `idx_flashcards_user_next` (`user_id`, `next_review_at`, `id`)  
   • `idx_flashcards_todays` (`user_id`, `next_review_at`) WHERE `next_review_at` <= CURRENT_DATE  
   • `idx_flashcards_subject_partial` (`subject`) WHERE `subject IS NOT NULL`  
   • `idx_flashcards_fts` on `fts` (GIN)

2. `review_history`  
   • PK on `id`  
   • `idx_review_history_flashcard` (`flashcard_id`)  
   • `idx_review_history_user_time` (`user_id`, `answered_at DESC`)

3. `review_sessions`  
   • PK on `id`  
   • Partial unique index `uidx_active_session` ON (`user_id`) WHERE `status = 'active'`

4. `events`  
   • Local PK per partition (`id`)  
   • `idx_events_user_time` (`user_id`, `logged_at DESC`)

5. `login_attempts`  
   • `idx_login_attempts_email_time` (`user_email`, `attempted_at DESC`)  
   • `idx_login_attempts_ip_time` (`ip`, `attempted_at DESC`)

6. `files`  
   • PK on `id`  
   • Unique on `checksum`

7. `flashcard_favourites`  
   • PK (`user_id`, `flashcard_id`)

## 4. Row-Level Security (RLS) Policies

_All domain tables have column `user_id` and share the policy template below._

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Select own rows
CREATE POLICY p_select_own ON <table_name>
  FOR SELECT USING (user_id = auth.uid());

-- Insert: enforce owner
CREATE POLICY p_insert_own ON <table_name>
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update/Delete: own rows only
CREATE POLICY p_change_own ON <table_name>
  FOR UPDATE, DELETE USING (user_id = auth.uid());
```

Additional policies:

- `events`, `audit_log` – readable by role `analytics` (via separate policy).
- `login_attempts` – writable by backend only (`service_role`).
- `system_flags` – read for all roles, write for `admin`.

## 5. Additional Notes & Design Decisions

- **UUID v7** primary keys improve index locality and are generated server-side via `pg_uuidv7`.
- **Trigger Set** (`created_at`, `updated_at`, `version`, `last_review_at`, `review_count`, `ease_factor`) implemented in PL/pgSQL for consistency; `flashcards_limit` trigger enforces max 2 000 cards per user (configurable in `system_flags`).
- **Full-text Search**: Materialised column `fts` (`to_tsvector('simple', coalesce(front,'') || ' ' || coalesce(back,''))`) updated by trigger.
- **Atomic Operation** `answer_flashcard(_flashcard_id uuid, _difficulty difficulty_enum, _client_ts timestamptz, _response_ms int)` performs: 1) insert into `review_history`, 2) update scheduling fields in `flashcards`, 3) notify `events`.
- **Partitioning**: `events` table is RANGE-partitioned by month to keep partitions < 10 M rows and allow pruning; future partitioning of `review_history` planned.
- **Rate Limiting**: `login_attempts` table combined with database function & partial index to block brute-force.
- **Maintenance**: cron tasks manage vacuum, drop old partitions (`events`, `login_attempts`) after 90 days.
- **Future-proofing**: placeholder tables `decks`, `ai_batches` added for Phase 2; subject ref table deferred – current varchar with partial index.
