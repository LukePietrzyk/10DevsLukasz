# API Endpoint Implementation Plan: Flashcards Management

## 1. Przegląd punktu końcowego

Implementacja kompleksowego systemu zarządzania flashcards obejmującego operacje CRUD z zaawansowanymi funkcjonalnościami:
- Listowanie kart z paginacją, filtrowaniem i sortowaniem
- Tworzenie pojedynczych kart i operacje batch (max 50 kart)
- Aktualizacja i usuwanie kart
- Walidacja limitów użytkownika (max 2000 kart)
- Integracja z systemem spaced repetition

## 2. Szczegóły żądania

### 2.1 GET /api/flashcards
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards?page=1&pageSize=50&search=term&subject=JavaScript&sort=created_at&order=desc`
- **Parametry:**
  - **Opcjonalne:**
    - `page` (number, default: 1) - numer strony
    - `pageSize` (number, default: 50, max: 50 desktop/25 mobile) - rozmiar strony
    - `limit` (number) - alternatywa dla paginacji, wzajemnie wykluczające się z page/pageSize
    - `search` (string) - wyszukiwanie full-text w front & back
    - `subject` (string) - filtrowanie po exact match subject
    - `sort` (string) - pole sortowania: `created_at`, `next_review_at` (default: `created_at`)
    - `order` (string) - kierunek sortowania: `asc`, `desc` (default: `desc`)

### 2.2 POST /api/flashcards
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/flashcards`
- **Request Body:**
```json
{
  "front": "What is a closure?",
  "back": "A function having access to the parent scope...",
  "subject": "JavaScript",
  "source": "manual",
  "generationId": "uuid"
}
```

### 2.3 POST /api/flashcards/batch
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/flashcards/batch`
- **Request Body:**
```json
{
  "flashcards": [
    {
      "front": "What is a closure?",
      "back": "A function having access to the parent scope...",
      "subject": "JavaScript",
      "source": "ai-full",
      "generationId": "uuid-123"
    }
  ]
}
```

### 2.4 GET /api/flashcards/{id}
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards/{id}`
- **Parametry:**
  - **Wymagane:** `id` (UUID) - identyfikator karty

### 2.5 PUT /api/flashcards/{id}
- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/flashcards/{id}`
- **Request Body:** Pełny obiekt FlashcardEntity

### 2.6 PATCH /api/flashcards/{id}
- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/flashcards/{id}`
- **Request Body:** Częściowa aktualizacja (front, back, subject)

### 2.7 DELETE /api/flashcards/{id}
- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/flashcards/{id}`

## 3. Wykorzystywane typy

### 3.1 Input DTOs
```typescript
// Już zdefiniowane w src/types.ts
- CreateFlashcardDto
- BatchCreateFlashcardsDto
- PaginationQueryDto
```

### 3.2 Response DTOs
```typescript
// Już zdefiniowane w src/types.ts
- FlashcardEntity
- FlashcardsListResponse (PaginatedResponseDto<FlashcardEntity>)
- BatchCreateResponse
- ValidationError
- BatchValidationErrorResponse
```

### 3.3 Zod Schemas (do utworzenia)
```typescript
// src/lib/schemas/flashcard.schemas.ts
- CreateFlashcardSchema
- BatchCreateFlashcardsSchema
- FlashcardQuerySchema
- UpdateFlashcardSchema
```

## 4. Szczegóły odpowiedzi

### 4.1 Kody statusu
- **200 OK** - pomyślne pobranie/aktualizacja
- **201 Created** - pomyślne utworzenie
- **204 No Content** - pomyślne usunięcie
- **400 Bad Request** - błąd walidacji
- **401 Unauthorized** - brak autoryzacji
- **403 Forbidden** - brak uprawnień (nie właściciel)
- **404 Not Found** - karta nie istnieje
- **409 Conflict** - przekroczenie limitu kart (>2000)
- **413 Payload Too Large** - batch przekracza 50 kart
- **422 Unprocessable Entity** - częściowe błędy walidacji batch
- **429 Too Many Requests** - przekroczenie rate limit
- **500 Internal Server Error** - błąd serwera

### 4.2 Struktury odpowiedzi
```json
// Pojedyncza karta
{
  "id": "uuid",
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

// Lista z paginacją
{
  "data": [FlashcardEntity[]],
  "page": 1,
  "pageSize": 50,
  "total": 150,
  "totalPages": 3
}

// Batch response
{
  "created": 2,
  "flashcards": [FlashcardEntity[]]
}
```

## 5. Przepływ danych

### 5.1 Architektura warstw
```
API Route → Middleware (Auth) → Service Layer → Database Layer
```

### 5.2 Szczegółowy przepływ
1. **Request** → Astro API route handler
2. **Authentication** → Middleware sprawdza JWT token
3. **Validation** → Zod schema validation
4. **Service Layer** → FlashcardService business logic
5. **Database** → Supabase client z RLS policies
6. **Response** → Formatted JSON response

### 5.3 Interakcje z bazą danych
- **Tabela główna:** `flashcards`
- **RLS Policy:** `user_id = auth.uid()`
- **Triggery:** `flashcards_limit` (max 2000), `updated_at`, `fts`
- **Indeksy:** `idx_flashcards_user_next`, `idx_flashcards_fts`

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie
- JWT Bearer tokens z Supabase Auth
- Token verification w middleware
- Automatyczne wyciąganie `user_id` z `auth.uid()`

### 6.2 Autoryzacja
- Row-Level Security w PostgreSQL
- Sprawdzenie ownership w service layer
- Polityki RLS: `p_select_own`, `p_insert_own`, `p_change_own`

### 6.3 Walidacja danych
- Zod schemas dla wszystkich inputs
- Sanityzacja HTML w front/back content
- Walidacja długości stringów zgodnie z DB constraints
- Sprawdzenie kombinacji source/generationId

### 6.4 Rate Limiting
- Write endpoints: 60 req/min/user
- Batch endpoints: 10 req/min/user
- Read endpoints: 120 req/min/user

### 6.5 Zabezpieczenia przed atakami
- SQL Injection: Supabase client + RLS
- XSS: Content sanitization
- CSRF: SameSite cookies
- DoS: Rate limiting + payload size limits

## 7. Obsługa błędów

### 7.1 Standardowy format błędów (RFC 7807)
```json
{
  "type": "validation_error",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Front text is required",
  "instance": "/api/flashcards"
}
```

### 7.2 Scenariusze błędów

#### 7.2.1 Walidacja (400)
- Brak wymaganych pól (front, back)
- Przekroczenie limitów znaków
- Nieprawidłowa kombinacja source/generationId
- Nieprawidłowe query parameters

#### 7.2.2 Autoryzacja (401/403)
- Brak lub nieprawidłowy JWT token
- Próba dostępu do cudzych kart
- Brak uprawnień do operacji

#### 7.2.3 Nie znaleziono (404)
- Karta o podanym ID nie istnieje
- Endpoint nie istnieje

#### 7.2.4 Konflikty biznesowe (409)
- Przekroczenie limitu 2000 kart/user
- Próba utworzenia duplikatu

#### 7.2.5 Batch errors (413/422)
- Batch przekracza 50 kart (413)
- Częściowe błędy walidacji (422) z detalami

#### 7.2.6 Rate limiting (429)
- Przekroczenie limitów żądań
- Retry-After header

### 7.3 Logowanie błędów
- Strukturalne logi JSON
- Error tracking do `events` table
- Monitoring z alertami

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacje bazy danych
- Indeksy na często używanych polach
- Partial index na `subject`
- GIN index na `fts` dla full-text search
- Connection pooling w Supabase

### 8.2 Caching
- HTTP caching headers dla GET requests
- ETags dla conditional requests
- Redis cache dla często używanych queries (future)

### 8.3 Paginacja
- Cursor-based pagination dla dużych zbiorów (future)
- Limit page size (50 desktop, 25 mobile)
- Total count optimization

### 8.4 Batch operations
- Transakcyjność (all-or-nothing)
- Bulk inserts w PostgreSQL
- Streaming responses dla dużych batch

## 9. Etapy wdrożenia

### 9.1 Przygotowanie infrastruktury
1. **Utworzenie Zod schemas** (`src/lib/schemas/flashcard.schemas.ts`)
2. **Konfiguracja Supabase client** (sprawdzenie `src/db/supabase.client.ts`)
3. **Middleware setup** (auth verification w `src/middleware/index.ts`)

### 9.2 Service Layer
4. **FlashcardService** (`src/lib/services/flashcard.service.ts`)
   - CRUD operations
   - Business logic validation
   - Error handling
   - Limit checking

### 9.3 API Routes Implementation
5. **GET /api/flashcards** (`src/pages/api/flashcards/index.ts`)
   - Query parameter validation
   - Pagination logic
   - Search & filtering
   - Sorting

6. **POST /api/flashcards** (same file)
   - Single card creation
   - Validation
   - Limit checking

7. **POST /api/flashcards/batch** (`src/pages/api/flashcards/batch.ts`)
   - Batch validation
   - Transaction handling
   - Partial error reporting

8. **Individual card operations** (`src/pages/api/flashcards/[id].ts`)
   - GET single card
   - PUT full update
   - PATCH partial update
   - DELETE card

### 9.5 Monitoring & Documentation
13. **Error monitoring** setup
14. **API documentation** (OpenAPI spec)
15. **Performance monitoring** dashboard
16. **Rate limiting** configuration

### 9.6 Deployment
17. **Environment configuration**
18. **Database migrations** (if needed)
19. **Production deployment**
20. **Monitoring & alerting** setup

## 10. Pliki do utworzenia/modyfikacji

### 10.1 Nowe pliki
- `src/lib/schemas/flashcard.schemas.ts` - Zod validation schemas
- `src/lib/services/flashcard.service.ts` - Business logic service
- `src/pages/api/flashcards/index.ts` - List & create endpoints
- `src/pages/api/flashcards/batch.ts` - Batch create endpoint
- `src/pages/api/flashcards/[id].ts` - Individual card operations

### 10.2 Modyfikacje istniejących
- `src/middleware/index.ts` - Auth middleware enhancement
- `src/db/supabase.client.ts` - Client configuration check
- `src/types.ts` - Dodatkowe typy jeśli potrzebne

### 10.3 Konfiguracja
- Rate limiting configuration
- Environment variables
- Database policies verification

Ten plan zapewnia kompleksową implementację systemu flashcards zgodną z specyfikacją API, wykorzystującą najlepsze praktyki bezpieczeństwa i wydajności w ekosystemie Astro + Supabase.
