# REST API Plan

## 1. Resources

| Resource                | Backing Table                              | Description                                                         |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Auth                    | Supabase `auth.users` & Supabase Auth REST | User registration, login, password management                       |
| Flashcards              | `flashcards`                               | User-owned study cards                                              |
| Review History          | `review_history`                           | Single answer to a flashcard during a session                       |
| Review Sessions         | `review_sessions`                          | Logical container for a sequence of reviews executed on a given day |
| Today Reviews (virtual) | `flashcards` filtered by `next_review_at`  | Convenience collection representing cards due today                 |
| Flashcard Favourites    | `flashcard_favourites`                     | Many-to-many shortcut between users and favourite cards             |
| System Flags (admin)    | `system_flags`                             | Feature flags & limits                                              |
| Events (internal)       | `events`                                   | Product analytics events                                            |

_MVP exposes only bolded resources in the PRD (Auth, Flashcards, Review Sessions/History). Other tables remain internal or for admin tooling._

## 2. Endpoints

### 2.2 Flashcards

| Method | Path                    | Description                                              |
| ------ | ----------------------- | -------------------------------------------------------- |
| GET    | `/api/flashcards`       | List cards (pagination, search, subject filter, sorting) |
| POST   | `/api/flashcards`       | Create single card                                       |
| POST   | `/api/flashcards/batch` | Create multiple cards (max 50 per request)               |
| GET    | `/api/flashcards/{id}`  | Get single card                                          |
| PUT    | `/api/flashcards/{id}`  | Replace card                                             |
| PATCH  | `/api/flashcards/{id}`  | Partial update (front, back, subject)                    |
| DELETE | `/api/flashcards/{id}`  | Permanently delete card                                  |

Query Parameters for list:

- `page` (default 1)
- `pageSize` (default 50, max 50 desktop / 25 mobile)
- `limit` – maximum number of flashcards to return (alternative to pagination, mutually exclusive with `page`/`pageSize`)
- `search` – full-text substring across `front` & `back`
- `subject` – exact match
- `sort` – field to sort by: `created_at`, `next_review_at` (default: `created_at`)
- `order` – sort direction: `asc` or `desc` (default: `desc`)

#### Create / Update Request Body (Single Card)

```json
{
  "front": "What is a closure?",
  "back": "A function having access to the parent scope...",
  "subject": "JavaScript", // optional
  "source": "manual", // optional: "manual" | "ai-full" | "ai-edited"
  "generationId": "uuid" // optional: required for ai-full and ai-edited sources
}
```

#### Batch Create Request Body

```json
{
  "flashcards": [
    {
      "front": "What is a closure?",
      "back": "A function having access to the parent scope...",
      "subject": "JavaScript",
      "source": "ai-full",
      "generationId": "uuid-123"
    },
    {
      "front": "What is hoisting?",
      "back": "JavaScript's behavior of moving declarations to the top...",
      "subject": "JavaScript",
      "source": "ai-full",
      "generationId": "uuid-123"
    }
  ]
}
```

Constraints for batch operations:

- Maximum 50 cards per batch request
- Each card follows same validation rules as single create
- Total cards across all user's flashcards still limited to 2000
- Atomic operation: either all cards are created or none (transaction)

#### Response (Single Card)

```json
{
  "id": "<uuid>",
  "front": "...",
  "back": "...",
  "subject": "JavaScript",
  "source": "manual",
  "generationId": null,
  "nextReviewAt": "2026-01-02",
  "lastReviewAt": null,
  "reviewCount": 0,
  "easeFactor": 2.5,
  "createdAt": "2026-01-02T10:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z"
}
```

#### Response (Batch Create)

```json
{
  "created": 2,
  "flashcards": [
    {
      "id": "<uuid1>",
      "front": "What is a closure?",
      "back": "A function having access to the parent scope...",
      "subject": "JavaScript",
      "source": "ai-full",
      "generationId": "uuid-123",
      "nextReviewAt": "2026-01-02",
      "lastReviewAt": null,
      "reviewCount": 0,
      "easeFactor": 2.5,
      "createdAt": "2026-01-02T10:00:00Z",
      "updatedAt": "2026-01-02T10:00:00Z"
    },
    {
      "id": "<uuid2>",
      "front": "What is hoisting?",
      "back": "JavaScript's behavior of moving declarations to the top...",
      "subject": "JavaScript",
      "source": "ai-full",
      "generationId": "uuid-123",
      "nextReviewAt": "2026-01-02",
      "lastReviewAt": null,
      "reviewCount": 0,
      "easeFactor": 2.5,
      "createdAt": "2026-01-02T10:00:00Z",
      "updatedAt": "2026-01-02T10:00:00Z"
    }
  ]
}
```

Success codes: `200 OK`, `201 Created`, `204 No Content` (delete)

Error codes:

- `400 Bad Request` – validation failed (single card), invalid batch format, or invalid source/generationId combination
- `403 Forbidden` – not owner
- `404 Not Found`
- `409 Conflict` – card limit exceeded (>2000) or batch would exceed limit
- `413 Payload Too Large` – batch exceeds 50 cards
- `422 Unprocessable Entity` – partial batch validation failures (with details)
- `429 Too Many Requests` – rate-limit
- `500 Internal Server Error`

#### Batch Error Response (422)

```json
{
  "type": "validation_error",
  "title": "Batch validation failed",
  "status": 422,
  "detail": "Some flashcards in the batch failed validation",
  "errors": [
    {
      "index": 0,
      "field": "front",
      "message": "Front text is required"
    },
    {
      "index": 2,
      "field": "back",
      "message": "Back text exceeds 300 characters"
    }
  ]
}
```

### 2.3 Review Workflow

#### 2.3.1 Start Session

| Method | Path                   | Description                                                          |
| ------ | ---------------------- | -------------------------------------------------------------------- |
| POST   | `/api/review-sessions` | Creates active session; returns list of card IDs due today (max 100) |

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

| Method | Path                                       | Description                            |
| ------ | ------------------------------------------ | -------------------------------------- |
| POST   | `/api/review-sessions/{sessionId}/answers` | Records answer & schedules next review |

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

| Method | Path                                        | Description                                                          |
| ------ | ------------------------------------------- | -------------------------------------------------------------------- |
| POST   | `/api/review-sessions/{sessionId}/complete` | Marks session as `completed`; fires `review_session_completed` event |

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
   - Batch endpoints: 10 req/min user (each batch counts as 1 request regardless of size)
   - Read endpoints: 120 req/min user

## 4. Validation & Business Logic

### 4.1 Flashcards Validation

- `front` required, 1-120 chars plain text _(DB `varchar(120)`)_
- `back` required, 1-300 chars plain text _(DB `varchar(300)`)_
- `subject` optional, ≤40 chars _(partial index on `subject`)_
- `source` optional, must be one of `"manual"`, `"ai-full"`, or `"ai-edited"` (defaults to `"manual"`)
- `generationId` required for `"ai-full"` and `"ai-edited"` sources, must be null for `"manual"` source
- Max 2 000 cards / user (`flashcards_limit` trigger). API returns **409 Conflict**.
- **Batch operations:** Max 50 cards per request, atomic transaction (all-or-nothing)
- **Batch validation:** Each card validated individually; partial failures return `422` with error details

### 4.2 Review Logic

| Difficulty | Next Interval | DB Update                                          |
| ---------- | ------------- | -------------------------------------------------- |
| hard       | +1 day        | `ease_factor` ↓ 0.20, `next_review_at = today + 1` |
| medium     | +1 day        | `ease_factor` stays, `next_review_at = today + 1`  |
| easy       | +3 days       | `ease_factor` ↑ 0.15, `next_review_at = today + 3` |

All changes executed atomically in PostgreSQL function `answer_flashcard(...)` (see design note §5.2 DB plan). API simply invokes the function.

### 4.3 Session Constraints

- Only one active session per user enforced by partial index `uidx_active_session`.
- Answers to cards outside active session → `409 Conflict`.

### 4.4 Global Error Handling

- JSON problem-details format (`application/problem+json`).
- Error payload: `type`, `title`, `status`, `detail`, `instance`.

## 5. Open Questions & Assumptions

1. Email verification skipped for MVP; register endpoint still returns verification email if Supabase config enabled.
2. `files` upload/download postponed; endpoints not included.
3. Analytics events sent async to `/api/events` internal bus; not exposed publicly.
4. Future AI endpoints will extend under `/api/ai/...`.
5. **Batch operations:** AI-generated flashcards will use `/api/flashcards/batch` endpoint with appropriate rate limiting and validation.
6. **Transaction handling:** Batch creates are atomic - if any card fails validation or would exceed user limits, entire batch is rejected.
