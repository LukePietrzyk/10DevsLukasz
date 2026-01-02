# REST API Plan

## 1. Resources

| Resource | Backing Table | Description |
|----------|---------------|-------------|
| Auth | Supabase `auth.users` & Supabase Auth REST | User registration, login, password management |
| Flashcards | `flashcards` | User-owned study cards |
| Review History | `review_history` | Single answer to a flashcard during a session |
| Review Sessions | `review_sessions` | Logical container for a sequence of reviews executed on a given day |
| Today Reviews (virtual) | `flashcards` filtered by `next_review_at` | Convenience collection representing cards due today |
| Flashcard Favourites | `flashcard_favourites` | Many-to-many shortcut between users and favourite cards |
| System Flags (admin) | `system_flags` | Feature flags & limits |
| Events (internal) | `events` | Product analytics events |

_MVP exposes only bolded resources in the PRD (Auth, Flashcards, Review Sessions/History). Other tables remain internal or for admin tooling._

## 2. Endpoints

### 2.1 Authentication

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/register` | Create account (email + password) | No |
| POST | `/api/auth/login` | Obtain JWT access & refresh tokens | No |
| POST | `/api/auth/logout` | Invalidate refresh token | Yes |
| POST | `/api/auth/password/reset/request` | Send reset-password email | No |
| POST | `/api/auth/password/reset/confirm` | Set new password with reset token | No |
| POST | `/api/auth/password/change` | Change password (current+new) | Yes |
| DELETE | `/api/auth/account` | **Hard-delete account & all data** | Yes |

All endpoints proxy to Supabase Auth SDK; application layer adds rate-limiting (90 req/min IP) and audit logging.

### 2.2 Flashcards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/flashcards` | List cards (pagination, search, subject filter, sorting) |
| POST | `/api/flashcards` | Create card |
| GET | `/api/flashcards/{id}` | Get single card |
| PUT | `/api/flashcards/{id}` | Replace card |
| PATCH | `/api/flashcards/{id}` | Partial update (front, back, subject) |
| DELETE | `/api/flashcards/{id}` | Permanently delete card |

Query Parameters for list:
- `page` (default 1), `pageSize` (default 50, max 50 desktop / 25 mobile)
- `search` – full-text substring across `front` & `back`
- `subject` – exact match
- `sort` – `created_at`, `next_review_at` (default `created_at desc`)

#### Create / Update Request Body
```json
{
  "front": "What is a closure?",
  "back": "A function having access to the parent scope...",
  "subject": "JavaScript" // optional
}
```

#### Response (single)
```json
{
  "id": "<uuid>",
  "front": "...",
  "back": "...",
  "subject": "JavaScript",
  "nextReviewAt": "2026-01-02",
  "lastReviewAt": null,
  "reviewCount": 0,
  "easeFactor": 2.5,
  "createdAt": "2026-01-02T10:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z"
}
```

Success codes: `200 OK`, `201 Created`, `204 No Content` (delete)

Error codes:
- `400 Bad Request` – validation failed
- `403 Forbidden` – not owner
- `404 Not Found`
- `409 Conflict` – card limit exceeded ( >2000 )
- `429 Too Many Requests` – rate-limit
- `500 Internal Server Error`

### 2.3 Review Workflow

#### 2.3.1 Start Session
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/review-sessions` | Creates active session; returns list of card IDs due today (max 100) |

Request body (optional) 
```json
{ "limit": 100 }
```

Response
```json
{
  "sessionId": "<uuid>",
  "total": 42,
  "flashcardIds": ["uuid1", "uuid2", ...]
}
```

#### 2.3.2 Submit Answer
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/review-sessions/{sessionId}/answers` | Records answer & schedules next review |

Request Body
```json
{
  "flashcardId": "uuid1",
  "difficulty": "hard" | "medium" | "easy",
  "clientTimestamp": "2026-01-02T10:05:00Z",
  "responseMs": 2400 // optional
}
```

Response
```json
{
  "nextReviewAt": "2026-01-03",
  "remaining": 41
}
```

#### 2.3.3 Complete Session
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/review-sessions/{sessionId}/complete` | Marks session as `completed`; fires `review_session_completed` event |

Response `204 No Content`

Error codes: `400` invalid difficulty, `404` unknown session/flashcard, `409` session already completed/aborted.

### 2.4 Today Reviews Convenience Endpoint (Read-only)

| GET | `/api/reviews/today` | Returns full card objects due today (≤ current date, capped 100) |

Useful for mobile apps that do not explicitly manage sessions.

### 2.5 Flashcard Favourites

_Not in MVP UI but trivial CRUD supplied for future-proofing._

| POST | `/api/flashcards/{id}/favourite` | add |
| DELETE | `/api/flashcards/{id}/favourite` | remove |
| GET | `/api/flashcards/favourites` | list favourites |

## 3. Authentication & Authorisation

1. **JWT Bearer Tokens** issued by Supabase Auth (`supabase-js` on the frontend). Token verified by API gateway/middleware.
2. **Row-Level Security** in PostgreSQL (`user_id = auth.uid()`) prevents access to foreign rows. API additionally checks ownership on `flashcards`, `review_history`, `review_sessions`.
3. **Role-based access:**
   - `authenticated` – default application user
   - `service_role` – backend-only cron / partition maintenance
   - `analytics` – read-only access to `events`, `audit_log`
4. **Rate Limiting**
   - Auth endpoints: 5 req/min IP
   - Write endpoints: 60 req/min user
   - Read endpoints: 120 req/min user

## 4. Validation & Business Logic

### 4.1 Flashcards Validation
- `front` required, 1-120 chars plain text  *(DB `varchar(120)`)*
- `back` required, 1-300 chars plain text  *(DB `varchar(300)`)*
- `subject` optional, ≤40 chars  *(partial index on `subject`)*
- Max 2 000 cards / user (`flashcards_limit` trigger). API returns **409 Conflict**.

### 4.2 Review Logic
| Difficulty | Next Interval | DB Update |
|------------|--------------|-----------|
| hard | +1 day | `ease_factor` ↓ 0.20, `next_review_at = today + 1` |
| medium | +1 day | `ease_factor` stays, `next_review_at = today + 1` |
| easy | +3 days | `ease_factor` ↑ 0.15, `next_review_at = today + 3` |

All changes executed atomically in PostgreSQL function `answer_flashcard(...)` (see design note §5.2 DB plan). API simply invokes the function.

### 4.3 Session Constraints
- Only one active session per user enforced by partial index `uidx_active_session`.
- Answers to cards outside active session → `409 Conflict`.

### 4.4 Global Error Handling
- JSON problem-details format (`application/problem+json`).
- Error payload: `type`, `title`, `status`, `detail`, `instance`.

### 4.5 Security & Performance
- CORS restricted to frontend origin.
- Pagination default 50 items; server-side upper-cap 100.
- Index usage:
  - `idx_flashcards_user_next` accelerates today reviews list.
  - FTS GIN index (`idx_flashcards_fts`) serves `search` parameter.
  - `idx_review_history_user_time` for user history analytics.
- All write endpoints idempotent via request UUID header (optional); duplicates return `201` w/ same body.

## 5. Open Questions & Assumptions
1. Email verification skipped for MVP; register endpoint still returns verification email if Supabase config enabled.
2. `files` upload/download postponed; endpoints not included.
3. Analytics events sent async to `/api/events` internal bus; not exposed publicly.
4. Future AI endpoints will extend under `/api/ai/...`.

