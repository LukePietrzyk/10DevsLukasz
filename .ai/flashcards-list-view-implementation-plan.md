# Plan implementacji widoku Lista fiszek (Dashboard)

## 1. Przegląd

Widok Lista fiszek (`/flashcards`) jest głównym ekranem aplikacji po zalogowaniu użytkownika. Umożliwia przeglądanie, wyszukiwanie, sortowanie i zarządzanie fiszkami użytkownika (CRUD). Widok jest responsywny - na desktopie wyświetla tabelę z 50 fiszkami na stronę, na mobile karty z 25 fiszkami na stronę.

**Główne funkcjonalności:**

- Wyświetlanie listy fiszek z paginacją
- Wyszukiwanie po treści (front/back) z debouncingiem 300ms
- Sortowanie po `created_at` lub `next_review_at` (asc/desc)
- Filtrowanie po subject (opcjonalne)
- Dodawanie nowej fiszki (modal)
- Edycja istniejącej fiszki (modal)
- Usuwanie fiszki (AlertDialog z potwierdzeniem)
- Obsługa stanów: ładowanie (skeleton), pusty stan, błędy

**Pokryte User Stories:**

- US-009: Przeglądanie listy fiszek
- US-010: Wyszukiwanie fiszek po treści
- US-011: Dodanie nowej fiszki ręcznie
- US-012: Edycja istniejącej fiszki
- US-013: Usunięcie fiszki
- US-018: Obsługa błędów przy zapisie fiszki

## 2. Routing widoku

**Ścieżka:** `/flashcards`

**Plik:** `src/pages/flashcards/index.astro`

**Typ:** Astro page z React component (client-side hydration)

**Ochrona:** Wymaga autentykacji (middleware przekierowuje na `/auth/login` jeśli brak sesji)

**Query parameters obsługiwane:**

- `page` - numer strony (domyślnie 1)
- `pageSize` - rozmiar strony (domyślnie 50 desktop / 25 mobile)
- `search` - fraza wyszukiwania
- `subject` - filtr po subject (exact match)
- `sort` - pole sortowania: `created_at` | `next_review_at` (domyślnie `created_at`)
- `order` - kierunek sortowania: `asc` | `desc` (domyślnie `desc`)

## 3. Struktura komponentów

```
FlashcardsPage (Astro)
└── FlashcardList (React)
    ├── FlashcardListHeader
    │   ├── SearchBar
    │   ├── SortSelect
    │   └── AddFlashcardButton
    ├── FlashcardListContent
    │   ├── SkeletonLoader (loading state)
    │   ├── EmptyState (no flashcards)
    │   ├── FlashcardTable (desktop)
    │   │   └── FlashcardTableRow[]
    │   └── FlashcardCardList (mobile)
    │       └── FlashcardCard[]
    └── Pagination
    ├── FlashcardForm (Dialog - create/edit)
    └── DeleteFlashcardDialog (AlertDialog)
```

## 4. Szczegóły komponentów

### FlashcardList

**Opis:** Główny komponent React zarządzający stanem listy fiszek, integracją z API przez React Query, oraz koordynacją wszystkich podkomponentów.

**Główne elementy:**

- Container div z Tailwind classes
- FlashcardListHeader (pasek z wyszukiwaniem, sortowaniem, przyciskiem dodawania)
- FlashcardListContent (warunkowe renderowanie: skeleton/empty/list)
- Pagination (przyciski nawigacji)
- FlashcardForm (modal Dialog - create/edit)
- DeleteFlashcardDialog (AlertDialog - potwierdzenie usunięcia)
- ToastContainer (globalne powiadomienia)

**Obsługiwane interakcje:**

- Inicjalizacja: odczyt query parameters z URL, ustawienie domyślnych wartości
- Zmiana wyszukiwania: debouncing 300ms, aktualizacja URL query params
- Zmiana sortowania: aktualizacja URL query params, refetch danych
- Zmiana paginacji: aktualizacja URL query params, refetch danych
- Kliknięcie "Dodaj fiszkę": otwarcie modala FlashcardForm w trybie create
- Kliknięcie "Edytuj" na fiszce: pobranie danych fiszki, otwarcie modala FlashcardForm w trybie edit
- Kliknięcie "Usuń" na fiszce: otwarcie DeleteFlashcardDialog
- Zapisz fiszkę (create): POST `/api/flashcards`, optimistic update, zamknięcie modala
- Zapisz fiszkę (edit): PATCH `/api/flashcards/{id}`, optimistic update, zamknięcie modala
- Usuń fiszkę: DELETE `/api/flashcards/{id}`, optimistic update, zamknięcie dialogu

**Obsługiwana walidacja:**

- Walidacja query parameters (przez FlashcardQuerySchema)
- Walidacja formularza fiszki (przez CreateFlashcardSchema/UpdateFlashcardSchema)
- Walidacja ID fiszki przy edycji/usuwaniu (UUID format)

**Typy:**

- Props: brak (komponent kontenerowy)
- State:
  - `searchQuery: string` - lokalny stan wyszukiwania (przed debouncingiem)
  - `isCreateModalOpen: boolean` - stan modala tworzenia
  - `isEditModalOpen: boolean` - stan modala edycji
  - `editingFlashcardId: string | null` - ID fiszki w trybie edycji
  - `deletingFlashcardId: string | null` - ID fiszki do usunięcia
- React Query:
  - `useQuery` dla GET `/api/flashcards` z parametrami z URL
  - `useMutation` dla POST `/api/flashcards` (create)
  - `useMutation` dla PATCH `/api/flashcards/{id}` (update)
  - `useMutation` dla DELETE `/api/flashcards/{id}` (delete)

**Props:** Brak (komponent kontenerowy)

### FlashcardListHeader

**Opis:** Pasek z kontrolkami wyszukiwania, sortowania i przyciskiem dodawania fiszki.

**Główne elementy:**

- Flex container (desktop: row, mobile: column)
- SearchBar (pole wyszukiwania z ikoną i przyciskiem clear)
- SortSelect (Select Shadcn/ui z opcjami sortowania)
- AddFlashcardButton (Button Shadcn/ui z ikoną plus)

**Obsługiwane interakcje:**

- Wprowadzanie tekstu w SearchBar: aktualizacja lokalnego stanu, debouncing 300ms, aktualizacja URL
- Zmiana sortowania w SortSelect: aktualizacja URL query params
- Kliknięcie AddFlashcardButton: otwarcie modala FlashcardForm w trybie create

**Obsługiwana walidacja:** Brak (walidacja na poziomie rodzica)

**Typy:**

- Props:
  - `searchValue: string` - aktualna wartość wyszukiwania
  - `onSearchChange: (value: string) => void` - callback zmiany wyszukiwania
  - `sortValue: "created_at" | "next_review_at"` - aktualne sortowanie
  - `orderValue: "asc" | "desc"` - aktualny kierunek sortowania
  - `onSortChange: (sort: "created_at" | "next_review_at") => void` - callback zmiany sortowania
  - `onOrderChange: (order: "asc" | "desc") => void` - callback zmiany kierunku
  - `onAddClick: () => void` - callback kliknięcia przycisku dodawania

**Props:** Zgodnie z opisem powyżej

### SearchBar

**Opis:** Pole wyszukiwania z debouncingiem i przyciskiem wyczyszczenia.

**Główne elementy:**

- Input Shadcn/ui z ikoną wyszukiwania (lucide-react Search)
- Przycisk wyczyszczenia (X) widoczny gdy wartość nie jest pusta
- Wrapper div z Tailwind classes

**Obsługiwane interakcje:**

- Wprowadzanie tekstu: aktualizacja wartości, wywołanie onChange po debouncingu 300ms
- Kliknięcie przycisku clear: wyczyszczenie wartości, wywołanie onChange z pustym stringiem
- Enter w polu: submit (opcjonalnie, może być zignorowane)

**Obsługiwana walidacja:** Brak (walidacja na poziomie API)

**Typy:**

- Props:
  - `value: string` - aktualna wartość
  - `onChange: (value: string) => void` - callback zmiany wartości (wywoływany po debouncingu)
  - `placeholder?: string` - placeholder tekstu (domyślnie "Szukaj fiszek...")
  - `debounceMs?: number` - czas debouncingu w ms (domyślnie 300)

**Props:** Zgodnie z opisem powyżej

### SortSelect

**Opis:** Select Shadcn/ui do wyboru pola i kierunku sortowania.

**Główne elementy:**

- Select Shadcn/ui z dwoma SelectItem:
  - Sortowanie po: "Data utworzenia" (created_at), "Data powtórki" (next_review_at)
  - Kierunek: "Rosnąco" (asc), "Malejąco" (desc)
- Etykiety tekstowe

**Obsługiwane interakcje:**

- Wybór pola sortowania: wywołanie onSortChange
- Wybór kierunku sortowania: wywołanie onOrderChange

**Obsługiwana walidacja:** Brak (walidacja na poziomie rodzica)

**Typy:**

- Props:
  - `sortValue: "created_at" | "next_review_at"` - aktualne sortowanie
  - `orderValue: "asc" | "desc"` - aktualny kierunek
  - `onSortChange: (sort: "created_at" | "next_review_at") => void` - callback zmiany sortowania
  - `onOrderChange: (order: "asc" | "desc") => void` - callback zmiany kierunku

**Props:** Zgodnie z opisem powyżej

### FlashcardListContent

**Opis:** Komponent warunkowo renderujący różne stany: skeleton loader, pusty stan, lub listę fiszek (tabela/karty).

**Główne elementy:**

- Warunkowe renderowanie:
  - `isLoading && <SkeletonLoader />`
  - `!isLoading && data.length === 0 && <EmptyState />`
  - `!isLoading && data.length > 0 && (isMobile ? <FlashcardCardList /> : <FlashcardTable />)`

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `isLoading: boolean` - czy dane są ładowane
  - `flashcards: FlashcardEntity[]` - lista fiszek
  - `onEdit: (id: string) => void` - callback edycji fiszki
  - `onDelete: (id: string) => void` - callback usunięcia fiszki
  - `isMobile: boolean` - czy widok mobile (z useMediaQuery hook)

**Props:** Zgodnie z opisem powyżej

### FlashcardTable

**Opis:** Tabela desktopowa wyświetlająca fiszki w formie wierszy.

**Główne elementy:**

- Table Shadcn/ui z nagłówkami kolumn:
  - Front (pytanie) - pełny tekst lub skrócony z "..."
  - Back (odpowiedź) - fragment (pierwsze 50 znaków) lub skrócony
  - Subject - badge z kolorem (jeśli ustawiony)
  - Next Review - data następnej powtórki (format: DD.MM.YYYY)
  - Actions - przyciski Edytuj i Usuń
- TableBody z FlashcardTableRow[] dla każdej fiszki

**Obsługiwane interakcje:**

- Kliknięcie "Edytuj": wywołanie onEdit z ID fiszki
- Kliknięcie "Usuń": wywołanie onDelete z ID fiszki
- Nawigacja klawiaturowa: ↑↓ między wierszami, Enter na wierszu = edycja

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `flashcards: FlashcardEntity[]` - lista fiszek
  - `onEdit: (id: string) => void` - callback edycji
  - `onDelete: (id: string) => void` - callback usunięcia

**Props:** Zgodnie z opisem powyżej

### FlashcardTableRow

**Opis:** Pojedynczy wiersz tabeli z danymi fiszki.

**Główne elementy:**

- TableRow Shadcn/ui z TableCell:
  - Front: tekst z truncate
  - Back: tekst z truncate
  - Subject: Badge Shadcn/ui (jeśli ustawiony) lub "-"
  - Next Review: formatowana data
  - Actions: ButtonGroup z przyciskami Edytuj i Usuń

**Obsługiwane interakcje:**

- Kliknięcie przycisku Edytuj: wywołanie onEdit
- Kliknięcie przycisku Usuń: wywołanie onDelete
- Hover: podświetlenie wiersza

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `flashcard: FlashcardEntity` - dane fiszki
  - `onEdit: (id: string) => void` - callback edycji
  - `onDelete: (id: string) => void` - callback usunięcia

**Props:** Zgodnie z opisem powyżej

### FlashcardCardList

**Opis:** Lista kart mobile wyświetlająca fiszki w formie kart.

**Główne elementy:**

- Container div z grid layout (1 kolumna na mobile)
- FlashcardCard[] dla każdej fiszki

**Obsługiwane interakcje:** Brak (delegacja do FlashcardCard)

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `flashcards: FlashcardEntity[]` - lista fiszek
  - `onEdit: (id: string) => void` - callback edycji
  - `onDelete: (id: string) => void` - callback usunięcia

**Props:** Zgodnie z opisem powyżej

### FlashcardCard

**Opis:** Pojedyncza karta mobile z danymi fiszki.

**Główne elementy:**

- Card Shadcn/ui z:
  - CardHeader: Front (pytanie) jako tytuł
  - CardContent: Back (odpowiedź) z truncate, Subject badge, Next Review data
  - CardFooter: przyciski Edytuj i Usuń

**Obsługiwane interakcje:**

- Kliknięcie przycisku Edytuj: wywołanie onEdit
- Kliknięcie przycisku Usuń: wywołanie onDelete
- Tap na karcie: opcjonalnie otwarcie szczegółów (nie w MVP)

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `flashcard: FlashcardEntity` - dane fiszki
  - `onEdit: (id: string) => void` - callback edycji
  - `onDelete: (id: string) => void` - callback usunięcia

**Props:** Zgodnie z opisem powyżej

### FlashcardForm

**Opis:** Modal Dialog Shadcn/ui z formularzem tworzenia/edycji fiszki używający React Hook Form + Zod.

**Główne elementy:**

- Dialog Shadcn/ui z:
  - DialogHeader: tytuł ("Dodaj fiszkę" / "Edytuj fiszkę")
  - DialogContent: Form z React Hook Form:
    - FormField: Front (Input Shadcn/ui, max 120 znaków)
    - FormField: Back (Textarea Shadcn/ui, max 300 znaków)
    - FormField: Subject (Input Shadcn/ui, opcjonalny, max 40 znaków)
    - FormField: Source (Select Shadcn/ui, tylko w trybie edit, read-only)
  - DialogFooter: przyciski:
    - "Anuluj" - zamknięcie modala
    - "Zapisz i dodaj kolejną" (tylko w trybie create, Ctrl+Enter)
    - "Zapisz" (Enter) / "Zapisz zmiany" (w trybie edit)

**Obsługiwane interakcje:**

- Wypełnianie formularza: walidacja inline przez React Hook Form
- Submit formularza: walidacja, wywołanie API, optimistic update, zamknięcie modala
- "Zapisz i dodaj kolejną": submit, zachowanie otwartego modala, wyczyszczenie formularza
- Klawiatura: Tab między polami, Enter = submit, Ctrl+Enter = "zapisz i dodaj kolejną"
- Zamknięcie modala: ESC lub kliknięcie backdrop, ostrzeżenie o niezapisanych zmianach (nice-to-have)

**Obsługiwana walidacja:**

- Front: wymagane, 1-120 znaków (zgodnie z CreateFlashcardSchema)
- Back: wymagane, 1-300 znaków (zgodnie z CreateFlashcardSchema)
- Subject: opcjonalny, max 40 znaków (zgodnie z CreateFlashcardSchema)
- Source: opcjonalny, enum ["manual", "ai-full", "ai-edited"] (zgodnie z CreateFlashcardSchema)
- GenerationId: wymagany dla AI sources, null dla manual (zgodnie z CreateFlashcardSchema)

**Typy:**

- Props:
  - `isOpen: boolean` - czy modal jest otwarty
  - `onClose: () => void` - callback zamknięcia modala
  - `mode: "create" | "edit"` - tryb formularza
  - `flashcardId?: string` - ID fiszki w trybie edit (do pobrania danych)
  - `onSuccess: (flashcard: FlashcardEntity, addAnother?: boolean) => void` - callback sukcesu
  - `onError: (error: ApiErrorResponse) => void` - callback błędu

**Props:** Zgodnie z opisem powyżej

### DeleteFlashcardDialog

**Opis:** AlertDialog Shadcn/ui z potwierdzeniem usunięcia fiszki.

**Główne elementy:**

- AlertDialog Shadcn/ui z:
  - AlertDialogHeader: tytuł "Usuń fiszkę"
  - AlertDialogContent: komunikat "Na pewno chcesz usunąć tę fiszkę? Tej operacji nie można cofnąć."
  - AlertDialogFooter: przyciski:
    - "Anuluj" - zamknięcie dialogu
    - "Usuń" (variant: destructive) - potwierdzenie usunięcia

**Obsługiwane interakcje:**

- Kliknięcie "Anuluj": zamknięcie dialogu
- Kliknięcie "Usuń": wywołanie API DELETE, optimistic update, zamknięcie dialogu, toast sukcesu
- ESC: zamknięcie dialogu

**Obsługiwana walidacja:**

- Weryfikacja ID fiszki (UUID format) przed wywołaniem API

**Typy:**

- Props:
  - `isOpen: boolean` - czy dialog jest otwarty
  - `onClose: () => void` - callback zamknięcia dialogu
  - `flashcardId: string | null` - ID fiszki do usunięcia
  - `flashcardFront?: string` - front fiszki (do wyświetlenia w komunikacie, opcjonalnie)
  - `onConfirm: (id: string) => Promise<void>` - callback potwierdzenia usunięcia

**Props:** Zgodnie z opisem powyżej

### SkeletonLoader

**Opis:** Placeholder ładowania wyświetlany podczas pobierania danych.

**Główne elementy:**

- Skeleton Shadcn/ui w formie:
  - Desktop: 10 wierszy tabeli z skeleton cells
  - Mobile: 5 kart z skeleton content

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `isMobile?: boolean` - czy widok mobile (domyślnie false)

**Props:** Zgodnie z opisem powyżej

### EmptyState

**Opis:** Ekran pustego stanu wyświetlany gdy użytkownik nie ma fiszek.

**Główne elementy:**

- Container div z centrowaniem
- Ikona ilustracyjna (lucide-react FileQuestion lub podobna)
- Nagłówek "Nie masz jeszcze fiszek"
- Opis "Zacznij od dodania swojej pierwszej fiszki"
- Przycisk "Dodaj fiszkę" (Button Shadcn/ui)

**Obsługiwane interakcje:**

- Kliknięcie "Dodaj fiszkę": otwarcie modala FlashcardForm w trybie create

**Obsługiwana walidacja:** Brak

**Typy:**

- Props:
  - `onAddClick: () => void` - callback kliknięcia przycisku dodawania

**Props:** Zgodnie z opisem powyżej

### Pagination

**Opis:** Komponent paginacji z przyciskami nawigacji.

**Główne elementy:**

- Container div z flex layout
- Przycisk "Poprzednie" (disabled gdy page === 1)
- Tekst "Strona X z Y" (lub podobny)
- Przycisk "Następne" (disabled gdy page === totalPages)
- Opcjonalnie: Select do zmiany pageSize (desktop: 25/50, mobile: 10/25)

**Obsługiwane interakcje:**

- Kliknięcie "Poprzednie": aktualizacja URL query params (page - 1)
- Kliknięcie "Następne": aktualizacja URL query params (page + 1)
- Zmiana pageSize: aktualizacja URL query params (pageSize, reset page do 1)

**Obsługiwana walidacja:**

- Weryfikacja page >= 1 i page <= totalPages
- Weryfikacja pageSize w dozwolonych wartościach (10, 25, 50)

**Typy:**

- Props:
  - `page: number` - aktualna strona
  - `pageSize: number` - rozmiar strony
  - `total: number` - całkowita liczba fiszek
  - `totalPages: number` - całkowita liczba stron
  - `onPageChange: (page: number) => void` - callback zmiany strony
  - `onPageSizeChange?: (pageSize: number) => void` - callback zmiany rozmiaru strony (opcjonalnie)

**Props:** Zgodnie z opisem powyżej

## 5. Typy

### Typy z `src/types.ts` (już istniejące)

**FlashcardEntity:**

```typescript
interface FlashcardEntity {
  id: string; // UUID
  front: string; // 1-120 znaków
  back: string; // 1-300 znaków
  subject: string | null; // opcjonalny, max 40 znaków
  source: FlashcardSource; // "manual" | "ai-full" | "ai-edited"
  generationId: string | null; // UUID dla AI sources
  nextReviewAt: string; // ISO date string
  lastReviewAt: string | null; // ISO date string
  reviewCount: number; // liczba powtórek
  easeFactor: number; // współczynnik łatwości (2.5 default)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
```

**FlashcardsListResponse:**

```typescript
type FlashcardsListResponse = PaginatedResponseDto<FlashcardEntity>;

interface PaginatedResponseDto<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

**FlashcardQueryDto:**

```typescript
interface FlashcardQueryDto extends PaginationQueryDto {
  search?: string; // fraza wyszukiwania
  subject?: string; // filtr po subject
  sort?: "created_at" | "next_review_at"; // pole sortowania
  order?: "asc" | "desc"; // kierunek sortowania
}

interface PaginationQueryDto {
  page?: number; // numer strony (1-based)
  pageSize?: number; // rozmiar strony (max 50)
  limit?: number; // alternatywa dla page/pageSize (max 100)
}
```

**CreateFlashcardDto:**

```typescript
interface CreateFlashcardDto {
  front: string; // wymagane, 1-120 znaków
  back: string; // wymagane, 1-300 znaków
  subject?: string; // opcjonalny, max 40 znaków
  source?: FlashcardSource; // opcjonalny, default "manual"
  generationId?: string; // opcjonalny, wymagany dla AI sources
}
```

**UpdateFlashcardDto:**

```typescript
interface UpdateFlashcardDto {
  front?: string; // opcjonalny, 1-120 znaków
  back?: string; // opcjonalny, 1-300 znaków
  subject?: string; // opcjonalny, max 40 znaków
  source?: FlashcardSource; // opcjonalny
  generationId?: string; // opcjonalny
}
```

**ApiErrorResponse:**

```typescript
interface ApiErrorResponse {
  type: string; // kod błędu (np. "validation_error")
  title: string; // tytuł błędu
  status: number; // kod HTTP
  detail: string; // szczegóły błędu
  instance?: string; // opcjonalny, ścieżka requestu
}
```

### Nowe typy ViewModel (opcjonalne, dla komponentów)

**FlashcardFormData:**

```typescript
interface FlashcardFormData {
  front: string;
  back: string;
  subject?: string;
}
```

**FlashcardListState:**

```typescript
interface FlashcardListState {
  searchQuery: string; // lokalny stan wyszukiwania (przed debouncingiem)
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  editingFlashcardId: string | null;
  deletingFlashcardId: string | null;
}
```

## 6. Zarządzanie stanem

### React Query (dane z API)

**Query Key:** `['flashcards', queryParams]` gdzie `queryParams` to obiekt FlashcardQueryDto

**Query Function:**

```typescript
async (queryParams: FlashcardQueryDto) => {
  const params = new URLSearchParams();
  if (queryParams.page) params.set("page", queryParams.page.toString());
  if (queryParams.pageSize) params.set("pageSize", queryParams.pageSize.toString());
  if (queryParams.search) params.set("search", queryParams.search);
  if (queryParams.subject) params.set("subject", queryParams.subject);
  if (queryParams.sort) params.set("sort", queryParams.sort);
  if (queryParams.order) params.set("order", queryParams.order);

  const response = await fetch(`/api/flashcards?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch flashcards");
  return response.json() as Promise<FlashcardsListResponse>;
};
```

**Query Options:**

- `keepPreviousData: true` - dla płynnej paginacji
- `staleTime: 60000` - dane są świeże przez 1 minutę
- `cacheTime: 300000` - cache przez 5 minut
- `refetchOnWindowFocus: false` - nie refetch przy powrocie do okna
- `refetchOnMount: true` - refetch przy mountcie komponentu

**Mutations:**

1. **Create Flashcard:**
   - `mutationFn`: POST `/api/flashcards` z CreateFlashcardDto
   - `onSuccess`: invalidate query `['flashcards']`, optimistic update, toast sukcesu
   - `onError`: toast błędu z ApiErrorResponse

2. **Update Flashcard:**
   - `mutationFn`: PATCH `/api/flashcards/{id}` z UpdateFlashcardDto
   - `onSuccess`: invalidate query `['flashcards']`, optimistic update, toast sukcesu
   - `onError`: toast błędu z ApiErrorResponse

3. **Delete Flashcard:**
   - `mutationFn`: DELETE `/api/flashcards/{id}`
   - `onSuccess`: invalidate query `['flashcards']`, optimistic update, toast sukcesu
   - `onError`: toast błędu z ApiErrorResponse

### Local State (React useState)

**W komponencie FlashcardList:**

- `searchQuery: string` - lokalny stan wyszukiwania (przed debouncingiem)
- `isCreateModalOpen: boolean` - stan modala tworzenia
- `isEditModalOpen: boolean` - stan modala edycji
- `editingFlashcardId: string | null` - ID fiszki w trybie edycji
- `deletingFlashcardId: string | null` - ID fiszki do usunięcia

### URL State (query parameters)

**Synchronizacja z URL:**

- Odczyt query parameters przy mountcie komponentu
- Aktualizacja URL przy zmianie filtrów/sortowania/paginacji (przez `useNavigate` lub `window.history.pushState`)
- Obsługa przycisku wstecz/przód przeglądarki (przez `popstate` event)

**Custom Hook: `useFlashcardQueryParams`**

```typescript
function useFlashcardQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParams: FlashcardQueryDto = {
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
    pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : isMobile ? 25 : 50,
    search: searchParams.get("search") || undefined,
    subject: searchParams.get("subject") || undefined,
    sort: (searchParams.get("sort") as "created_at" | "next_review_at") || "created_at",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
  };

  const updateQueryParams = (updates: Partial<FlashcardQueryDto>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });
    setSearchParams(newParams);
  };

  return { queryParams, updateQueryParams };
}
```

### Custom Hooks

**`useDebounce<T>(value: T, delay: number): T`**

- Hook do debouncingu wartości (używany dla wyszukiwania)
- Implementacja: `useState` + `useEffect` z `setTimeout`

**`useMediaQuery(query: string): boolean`**

- Hook do wykrywania rozmiaru ekranu (mobile/desktop)
- Implementacja: `useState` + `useEffect` z `window.matchMedia`

**`useFlashcardMutations()`**

- Hook zwracający mutations dla create/update/delete
- Implementacja: `useMutation` z React Query

## 7. Integracja API

### GET `/api/flashcards`

**Request:**

- Method: GET
- URL: `/api/flashcards?page=1&pageSize=50&search=test&sort=created_at&order=desc`
- Headers: Authorization Bearer token (automatycznie przez Supabase client)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is a closure?",
      "back": "A function having access to the parent scope...",
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
  ],
  "page": 1,
  "pageSize": 50,
  "total": 100,
  "totalPages": 2
}
```

**Error Responses:**

- 400 Bad Request: nieprawidłowe query parameters
- 500 Internal Server Error: błąd serwera

### POST `/api/flashcards`

**Request:**

- Method: POST
- URL: `/api/flashcards`
- Headers:
  - `Content-Type: application/json`
  - Authorization Bearer token
- Body: `CreateFlashcardDto`

**Response (201 Created):**

```json
{
  "id": "uuid",
  "front": "What is a closure?",
  "back": "A function having access to the parent scope...",
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

**Error Responses:**

- 400 Bad Request: walidacja nie powiodła się
- 409 Conflict: limit 2000 fiszek przekroczony
- 500 Internal Server Error: błąd serwera

### GET `/api/flashcards/{id}`

**Request:**

- Method: GET
- URL: `/api/flashcards/{id}`
- Headers: Authorization Bearer token

**Response (200 OK):**

```json
{
  "id": "uuid",
  "front": "What is a closure?",
  "back": "A function having access to the parent scope...",
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

**Error Responses:**

- 400 Bad Request: nieprawidłowy UUID
- 404 Not Found: fiszka nie znaleziona
- 500 Internal Server Error: błąd serwera

### PATCH `/api/flashcards/{id}`

**Request:**

- Method: PATCH
- URL: `/api/flashcards/{id}`
- Headers:
  - `Content-Type: application/json`
  - Authorization Bearer token
- Body: `UpdateFlashcardDto` (partial)

**Response (200 OK):**

```json
{
  "id": "uuid",
  "front": "Updated question",
  "back": "Updated answer",
  "subject": "JavaScript",
  "source": "manual",
  "generationId": null,
  "nextReviewAt": "2026-01-02",
  "lastReviewAt": null,
  "reviewCount": 0,
  "easeFactor": 2.5,
  "createdAt": "2026-01-02T10:00:00Z",
  "updatedAt": "2026-01-02T11:00:00Z"
}
```

**Error Responses:**

- 400 Bad Request: walidacja nie powiodła się lub brak pól do aktualizacji
- 404 Not Found: fiszka nie znaleziona
- 500 Internal Server Error: błąd serwera

### DELETE `/api/flashcards/{id}`

**Request:**

- Method: DELETE
- URL: `/api/flashcards/{id}`
- Headers: Authorization Bearer token

**Response (204 No Content):**

- Brak body

**Error Responses:**

- 400 Bad Request: nieprawidłowy UUID
- 404 Not Found: fiszka nie znaleziona
- 500 Internal Server Error: błąd serwera

## 8. Interakcje użytkownika

### Wyszukiwanie

1. **Użytkownik wpisuje tekst w SearchBar:**
   - Aktualizacja lokalnego stanu `searchQuery`
   - Debouncing 300ms
   - Po 300ms: aktualizacja URL query parameter `search`
   - React Query automatycznie refetchuje dane z nowym parametrem
   - Wyświetlenie skeleton loader podczas ładowania
   - Aktualizacja listy fiszek

2. **Użytkownik czyści wyszukiwanie:**
   - Kliknięcie przycisku X w SearchBar
   - Wyczyszczenie lokalnego stanu `searchQuery`
   - Usunięcie query parameter `search` z URL
   - React Query refetchuje pełną listę

### Sortowanie

1. **Użytkownik zmienia pole sortowania:**
   - Wybór opcji w SortSelect (np. "Data powtórki")
   - Aktualizacja URL query parameter `sort=next_review_at`
   - React Query refetchuje dane z nowym sortowaniem
   - Aktualizacja listy fiszek

2. **Użytkownik zmienia kierunek sortowania:**
   - Wybór opcji w SortSelect (np. "Rosnąco")
   - Aktualizacja URL query parameter `order=asc`
   - React Query refetchuje dane
   - Aktualizacja listy fiszek

### Paginacja

1. **Użytkownik klika "Następne":**
   - Aktualizacja URL query parameter `page=2`
   - React Query refetchuje dane z `keepPreviousData: true` (płynne przejście)
   - Aktualizacja listy fiszek bez migotania

2. **Użytkownik klika "Poprzednie":**
   - Aktualizacja URL query parameter `page=1`
   - React Query używa cache'owanych danych (jeśli dostępne)
   - Aktualizacja listy fiszek

### Dodawanie fiszki

1. **Użytkownik klika "Dodaj fiszkę":**
   - Otwarcie modala FlashcardForm w trybie create
   - Wyświetlenie pustego formularza

2. **Użytkownik wypełnia formularz:**
   - Walidacja inline przez React Hook Form
   - Komunikaty błędów pod polami (jeśli nieprawidłowe)

3. **Użytkownik klika "Zapisz":**
   - Walidacja formularza
   - Wywołanie mutation POST `/api/flashcards`
   - Optimistic update: dodanie fiszki do listy (tymczasowo)
   - Po sukcesie: invalidate query, zamknięcie modala, toast sukcesu
   - Po błędzie: wycofanie optimistic update, wyświetlenie błędu w formularzu, toast błędu

4. **Użytkownik klika "Zapisz i dodaj kolejną" (Ctrl+Enter):**
   - Walidacja i zapis jak wyżej
   - Po sukcesie: wyczyszczenie formularza, pozostawienie otwartego modala
   - Focus na polu Front

### Edycja fiszki

1. **Użytkownik klika "Edytuj" na fiszce:**
   - Pobranie danych fiszki przez GET `/api/flashcards/{id}`
   - Otwarcie modala FlashcardForm w trybie edit
   - Wypełnienie formularza danymi fiszki

2. **Użytkownik modyfikuje dane:**
   - Walidacja inline
   - Komunikaty błędów pod polami

3. **Użytkownik klika "Zapisz zmiany":**
   - Walidacja formularza
   - Wywołanie mutation PATCH `/api/flashcards/{id}`
   - Optimistic update: aktualizacja fiszki na liście (tymczasowo)
   - Po sukcesie: invalidate query, zamknięcie modala, toast sukcesu
   - Po błędzie: wycofanie optimistic update, wyświetlenie błędu, toast błędu

### Usuwanie fiszki

1. **Użytkownik klika "Usuń" na fiszce:**
   - Otwarcie DeleteFlashcardDialog
   - Wyświetlenie komunikatu potwierdzającego

2. **Użytkownik klika "Usuń" w dialogu:**
   - Wywołanie mutation DELETE `/api/flashcards/{id}`
   - Optimistic update: usunięcie fiszki z listy (tymczasowo)
   - Po sukcesie: invalidate query, zamknięcie dialogu, toast sukcesu
   - Po błędzie: wycofanie optimistic update, wyświetlenie błędu, toast błędu

3. **Użytkownik klika "Anuluj":**
   - Zamknięcie dialogu bez zmian

## 9. Warunki i walidacja

### Walidacja query parameters

**W komponencie FlashcardList przy mountcie:**

- Odczyt query parameters z URL
- Walidacja przez `FlashcardQuerySchema` (Zod)
- Ustawienie domyślnych wartości jeśli brak parametrów:
  - `page: 1`
  - `pageSize: 50` (desktop) lub `25` (mobile)
  - `sort: "created_at"`
  - `order: "desc"`
- Jeśli parametry nieprawidłowe: wyświetlenie błędu, ustawienie domyślnych wartości

**Przy zmianie parametrów:**

- Walidacja przed aktualizacją URL
- Jeśli nieprawidłowe: wyświetlenie błędu, brak aktualizacji URL

### Walidacja formularza fiszki

**W komponencie FlashcardForm:**

- Walidacja przez React Hook Form z integracją Zod (`CreateFlashcardSchema` / `UpdateFlashcardSchema`)
- Walidacja inline przy blur każdego pola
- Komunikaty błędów pod polami:
  - Front: "Front text is required" (jeśli puste), "Front text cannot exceed 120 characters" (jeśli za długie)
  - Back: "Back text is required" (jeśli puste), "Back text cannot exceed 300 characters" (jeśli za długie)
  - Subject: "Subject cannot exceed 40 characters" (jeśli za długie)
- Walidacja przed submit: sprawdzenie wszystkich pól, blokada submit jeśli błędy

**Walidacja po stronie API:**

- API zwraca 400 Bad Request z szczegółami błędów jeśli walidacja nie powiodła się
- Frontend wyświetla błędy z API w formularzu (pod odpowiednimi polami)

### Walidacja ID fiszki

**Przy edycji/usuwaniu:**

- Weryfikacja formatu UUID przed wywołaniem API
- Jeśli nieprawidłowy: wyświetlenie błędu, brak wywołania API

### Warunki wyświetlania

**SkeletonLoader:**

- Wyświetlany gdy `isLoading === true` w React Query

**EmptyState:**

- Wyświetlany gdy `!isLoading && data.length === 0`

**FlashcardTable / FlashcardCardList:**

- Wyświetlany gdy `!isLoading && data.length > 0`

**Pagination:**

- Wyświetlany gdy `totalPages > 1`
- Przycisk "Poprzednie" disabled gdy `page === 1`
- Przycisk "Następne" disabled gdy `page === totalPages`

**Przycisk "Zapisz i dodaj kolejną":**

- Widoczny tylko w trybie create
- Ukryty w trybie edit

## 10. Obsługa błędów

### Błędy API

**400 Bad Request (walidacja):**

- Wyświetlenie błędów walidacji w formularzu (pod odpowiednimi polami)
- Toast z komunikatem "Sprawdź błędy w formularzu"
- Zachowanie danych w formularzu

**403 Forbidden:**

- Toast z komunikatem "Brak dostępu do tej fiszki"
- Zamknięcie modala/dialogu
- Przekierowanie na `/flashcards` (opcjonalnie)

**404 Not Found:**

- Toast z komunikatem "Fiszka nie została znaleziona"
- Zamknięcie modala/dialogu
- Refetch listy fiszek

**409 Conflict (limit 2000 fiszek):**

- Toast z komunikatem "Osiągnięto limit 2000 fiszek. Usuń niektóre fiszki, aby dodać nowe."
- Wyświetlenie ErrorMessage z zachętą do porządków
- Zamknięcie modala (jeśli otwarty)

**429 Too Many Requests (rate limiting):**

- Toast z komunikatem "Zbyt wiele żądań. Spróbuj ponownie za chwilę."
- Exponential backoff dla automatycznych ponownych prób (opcjonalnie)
- Wyświetlenie ErrorMessage z informacją o odczekaniu

**500 Internal Server Error:**

- Toast z komunikatem "Wystąpił błąd serwera. Spróbuj ponownie."
- Wyświetlenie ErrorMessage z przyciskiem "Spróbuj ponownie"
- Zachowanie danych w formularzu (jeśli dotyczy)

### Błędy sieciowe

**Brak połączenia (offline):**

- Wykrywanie przez `navigator.onLine` lub failed fetch
- Wyświetlenie ErrorMessage z komunikatem "Brak połączenia z internetem"
- Blokada akcji wymagających komunikacji z serwerem
- Próba automatycznego ponowienia po odzyskaniu połączenia

**Timeout:**

- Wykrywanie przez timeout w fetch (opcjonalnie, przez AbortController)
- Toast z komunikatem "Przekroczono limit czasu. Spróbuj ponownie."
- Wyświetlenie ErrorMessage z przyciskiem "Spróbuj ponownie"

### Błędy walidacji formularza

**Błędy inline:**

- Wyświetlenie pod każdym polem z błędem
- Podświetlenie pola na czerwono
- Blokada submit formularza

**Błędy z API:**

- Mapowanie błędów z ApiErrorResponse na pola formularza
- Wyświetlenie pod odpowiednimi polami
- Toast z ogólnym komunikatem błędu

### Optimistic Updates

**Wycofanie optimistic update przy błędzie:**

- W `onError` mutation: wywołanie `queryClient.setQueryData` z poprzednimi danymi
- Wyświetlenie błędu użytkownikowi
- Toast z komunikatem błędu

### Error Boundary

**Globalny Error Boundary:**

- Przechwytywanie nieobsłużonych błędów React
- Wyświetlenie ekranu "Coś poszło nie tak. Spróbuj odświeżyć stronę."
- Zapisywanie logów błędu (konsola lub endpoint backendowy)

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utworzenie pliku `src/pages/flashcards/index.astro`
2. Utworzenie katalogu `src/components/flashcards/`
3. Utworzenie plików komponentów:
   - `FlashcardList.tsx`
   - `FlashcardListHeader.tsx`
   - `SearchBar.tsx`
   - `SortSelect.tsx`
   - `FlashcardListContent.tsx`
   - `FlashcardTable.tsx`
   - `FlashcardTableRow.tsx`
   - `FlashcardCardList.tsx`
   - `FlashcardCard.tsx`
   - `FlashcardForm.tsx`
   - `DeleteFlashcardDialog.tsx`
   - `SkeletonLoader.tsx`
   - `EmptyState.tsx`
   - `Pagination.tsx`

### Krok 2: Instalacja zależności

1. Sprawdzenie czy React Query jest zainstalowany: `@tanstack/react-query`
2. Sprawdzenie czy React Hook Form jest zainstalowany: `react-hook-form` + `@hookform/resolvers` (dla Zod)
3. Instalacja brakujących zależności jeśli potrzeba

### Krok 3: Utworzenie custom hooks

1. Utworzenie `src/components/hooks/useDebounce.ts`
2. Utworzenie `src/components/hooks/useMediaQuery.ts`
3. Utworzenie `src/components/hooks/useFlashcardQueryParams.ts`
4. Utworzenie `src/components/hooks/useFlashcardMutations.ts`

### Krok 4: Implementacja komponentów pomocniczych

1. Implementacja `SearchBar.tsx` z debouncingiem
2. Implementacja `SortSelect.tsx` z Shadcn/ui Select
3. Implementacja `SkeletonLoader.tsx` z Shadcn/ui Skeleton
4. Implementacja `EmptyState.tsx` z ikoną i przyciskiem
5. Implementacja `Pagination.tsx` z przyciskami nawigacji

### Krok 5: Implementacja komponentów listy

1. Implementacja `FlashcardTableRow.tsx` z danymi fiszki
2. Implementacja `FlashcardTable.tsx` z Table Shadcn/ui
3. Implementacja `FlashcardCard.tsx` z Card Shadcn/ui
4. Implementacja `FlashcardCardList.tsx` z grid layout
5. Implementacja `FlashcardListContent.tsx` z warunkowym renderowaniem

### Krok 6: Implementacja formularza

1. Implementacja `FlashcardForm.tsx` z React Hook Form + Zod
2. Integracja z Shadcn/ui Form components
3. Obsługa trybu create/edit
4. Obsługa klawiatury (Tab, Enter, Ctrl+Enter)
5. Walidacja inline z komunikatami błędów

### Krok 7: Implementacja dialogu usuwania

1. Implementacja `DeleteFlashcardDialog.tsx` z AlertDialog Shadcn/ui
2. Obsługa potwierdzenia usunięcia
3. Integracja z mutation delete

### Krok 8: Implementacja głównego komponentu

1. Implementacja `FlashcardList.tsx` z React Query
2. Integracja z custom hooks (useFlashcardQueryParams, useFlashcardMutations)
3. Obsługa stanów modali (create/edit/delete)
4. Obsługa optimistic updates
5. Integracja z ToastContainer dla powiadomień
6. Obsługa błędów z ErrorMessage

### Krok 9: Implementacja strony Astro

1. Utworzenie `src/pages/flashcards/index.astro`
2. Import i renderowanie `FlashcardList` jako client component
3. Konfiguracja React Query Provider (jeśli potrzeba)
4. Dodanie middleware protection (sprawdzenie autentykacji)

### Krok 10: Integracja z nawigacją

1. Dodanie linku do `/flashcards` w nawigacji głównej
2. Ustawienie jako domyślny widok po logowaniu (redirect w middleware)
3. Dodanie breadcrumbs (opcjonalnie)

### Krok 11: Testy i optymalizacja

1. Testowanie wszystkich interakcji użytkownika
2. Testowanie responsywności (desktop/mobile)
3. Testowanie obsługi błędów
4. Optymalizacja wydajności (React.memo, useMemo, useCallback)
5. Testowanie dostępności (ARIA labels, keyboard navigation)

### Krok 12: Dokumentacja i cleanup

1. Dodanie komentarzy JSDoc do komponentów
2. Sprawdzenie zgodności z linterem
3. Aktualizacja dokumentacji projektu (jeśli potrzeba)
