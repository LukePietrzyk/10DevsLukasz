# Architektura UI dla "Fiszki" – MVP

## 1. Przegląd struktury UI

Aplikacja wykorzystuje hybrydowe podejście Astro + React, zoptymalizowane pod MVP z naciskiem na minimalną frustrację użytkownika i łatwość korzystania:

- **Astro 5** – deklaratywny routing (`/src/pages`), renderowanie stron statycznych/SSR, podstawa layoutów.
- **React 19** – interaktywne komponenty (formularze, listy, modale, sesja powtórek).
- **Tailwind 4** – responsywny układ z utility variants (sm, md, lg, xl) zamiast custom breakpoints.
- **Shadcn/ui** – spójny zbiór komponentów bazowych (Button, Input, Dialog, AlertDialog, Toast, Skeleton, NavigationMenu).
- **TypeScript 5** – typowanie end-to-end (komponenty + integracja z API).

### Główne filary projektowe

- **Responsywność kontekstowa** – desktop zoptymalizowany pod tworzenie/zarządzanie (50 fiszek na stronę), mobile pod szybkie powtórki (25 fiszek na stronę).
- **Zarządzanie stanem** – React hooks i React Context dla stanu autentykacji (AuthContext), React Query dla cache'owania danych z API, localStorage dla sessionId i tymczasowych danych. Zustand tylko w razie potrzeby.
- **Integracja z API** – React Query z `keepPreviousData: true` dla paginacji, debouncing 300ms dla wyszukiwania, URL query parameters dla sortowania i filtrów.
- **Bezpieczeństwo & UX** – walidacja inline (komunikaty przy formularzach/akcjach), mapowanie kodów HTTP na komunikaty po polsku, exponential backoff dla automatycznych ponownych prób (429).
- **Dostępność** – komponenty Shadcn/ui z wbudowaną dostępnością, aria-labels dla przycisków i formularzy, focus management w ekranie powtórek, wizualne wskazówki skrótów klawiszowych.

## 2. Lista widoków

### 2.1 Widoki autentykacji (Priorytet 1)

#### Widok 1: Rejestracja
- **Ścieżka**: `/auth/register`
- **Główny cel**: Założenie konta użytkownika przy użyciu emaila i hasła
- **Kluczowe informacje**:
  - Formularz z polami: email, hasło, potwierdzenie hasła
  - Link do logowania dla istniejących użytkowników
  - Informacja o minimalnych wymaganiach hasła (min. 8 znaków)
- **Kluczowe komponenty**:
  - `AuthLayout` (wspólny layout dla ekranów auth)
  - `RegisterForm` (React component z React Hook Form)
  - `EmailInput`, `PasswordInput` (Shadcn/ui Input z walidacją)
  - `FormError` (komponent do wyświetlania błędów inline)
  - `Button` (Shadcn/ui)
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja live z komunikatami ARIA
  - Minimalne reguły hasła wyświetlane przed wypełnieniem
  - Próba rejestracji z istniejącym emailem zwraca czytelny błąd (bez ujawniania szczegółów)
  - Po poprawnej rejestracji automatyczne logowanie lub przekierowanie do `/auth/login`
  - Tab order: email → hasło → potwierdzenie → przycisk rejestracji
  - Focus trap w formularzu

#### Widok 2: Logowanie
- **Ścieżka**: `/auth/login`
- **Główny cel**: Dostęp do aplikacji dla zarejestrowanych użytkowników
- **Kluczowe informacje**:
  - Formularz z polami: email, hasło
  - Link "Zapomniałem hasła" prowadzący do `/auth/forgot`
  - Link do rejestracji dla nowych użytkowników
- **Kluczowe komponenty**:
  - `AuthLayout`
  - `LoginForm` (React component)
  - `EmailInput`, `PasswordInput`
  - `FormError`
  - `Button`
- **UX, dostępność i bezpieczeństwo**:
  - Brak ujawniania, czy email istnieje (neutralne komunikaty błędów)
  - Opcjonalne pole "Pamiętaj mnie" (zgodnie z konfiguracją Supabase)
  - Po poprawnym logowaniu przekierowanie na `/flashcards` (dashboard)
  - Ochrona przed brute-force (cooldown po X nieudanych próbach)
  - Rate limiting: 5 req/min IP
  - Komunikaty błędów bez ujawniania szczegółów bezpieczeństwa

#### Widok 3: Reset hasła – żądanie
- **Ścieżka**: `/auth/forgot`
- **Główny cel**: Wysłanie maila z linkiem do resetu hasła
- **Kluczowe informacje**:
  - Pole email
  - Informacja o wysłaniu maila (nawet jeśli konto nie istnieje)
  - Link powrotu do logowania
- **Kluczowe komponenty**:
  - `AuthLayout`
  - `ForgotPasswordForm` (React component)
  - `EmailInput`
  - `InfoAlert` (Shadcn/ui Alert)
  - `Button`
- **UX, dostępność i bezpieczeństwo**:
  - Brak ujawniania istnienia konta (zachowanie neutralne)
  - Po wysłaniu maila komunikat sukcesu z instrukcjami
  - Rate limiting: 5 req/min IP

#### Widok 4: Reset hasła – zmiana
- **Ścieżka**: `/auth/reset`
- **Główny cel**: Ustawienie nowego hasła po kliknięciu w link z maila
- **Kluczowe informacje**:
  - Formularz z polami: nowe hasło, potwierdzenie hasła
  - Token resetujący z URL (query parameter)
  - Walidacja silnego hasła
- **Kluczowe komponenty**:
  - `AuthLayout`
  - `ResetPasswordForm` (React component)
  - `PasswordInput` × 2
  - `FormError`
  - `Button`
- **UX, dostępność i bezpieczeństwo**:
  - Token z URL weryfikowany przed wyświetleniem formularza
  - Walidacja silnego hasła (min. 8 znaków)
  - Po ustawieniu hasła przekierowanie do `/auth/login`
  - Komunikaty błędów dla nieprawidłowego/wygasłego tokenu

### 2.2 Widoki główne aplikacji (Priorytet 1)

#### Widok 5: Dashboard / Lista fiszek
- **Ścieżka**: `/flashcards` (domyślny widok po logowaniu)
- **Główny cel**: Przeglądanie i zarządzanie własnymi fiszkami
- **Kluczowe informacje**:
  - Lista fiszek w formie tabeli/listy z paginacją (50 desktop / 25 mobile)
  - Dla każdej fiszki: front (pełny lub skrócony), fragment back, subject (jeśli ustawiony)
  - Pole wyszukiwania z debouncingiem 300ms
  - Sortowanie przez URL query parameters (`sort=created_at&order=desc`)
  - Filtrowanie po subject (opcjonalne, przez URL query)
  - Przycisk "Dodaj fiszkę" otwierający modal
  - Akcje dla każdej fiszki: Edytuj (modal), Usuń (AlertDialog z potwierdzeniem)
  - Licznik fiszek do powtórki na dziś (badge w nawigacji)
- **Kluczowe komponenty**:
  - `FlashcardList` (React component z React Query)
  - `FlashcardTable` / `FlashcardCard` (responsive: tabela desktop, karty mobile)
  - `SearchBar` (z debouncingiem)
  - `SortSelect` (Shadcn/ui Select)
  - `Pagination` (Shadcn/ui Pagination)
  - `FlashcardForm` (modal Dialog Shadcn/ui)
  - `DeleteFlashcardDialog` (AlertDialog Shadcn/ui)
  - `SkeletonLoader` (dla listy podczas ładowania)
  - `EmptyState` (gdy brak fiszek)
- **UX, dostępność i bezpieczeństwo**:
  - Skeleton loaders podczas ładowania
  - Sortowalne kolumny z wskaźnikami wizualnymi
  - Nawigacja klawiaturowa (↑↓, Enter do edycji)
  - Komunikaty błędów inline przy operacjach CRUD
  - Limit 2000 fiszek: komunikat i zachęta do porządków po przekroczeniu (409 Conflict)
  - React Query z `keepPreviousData: true` dla płynnej paginacji
  - URL query parameters dla sortowania i filtrów (shareable links)
  - Optimistic updates dla szybkiego feedbacku

#### Widok 6: Generowanie fiszek z AI (Priorytet 1, Phase 2)
- **Ścieżka**: `/flashcards/generate`
- **Główny cel**: Główny przepływ po logowaniu – generowanie fiszek z tekstu źródłowego przy użyciu AI
- **Kluczowe informacje**:
  - Formularz wprowadzania tekstu źródłowego (textarea)
  - Przycisk "Generuj fiszki"
  - Lista propozycji fiszek wygenerowanych przez AI (po generowaniu)
  - Recenzja jednostkowa dla każdej propozycji:
    - Stan: pending, accepted, edited, rejected
    - Akcje: Akceptuj, Edytuj (inline/modal), Odrzuć
  - Bulk save: "Zapisz wszystkie" lub "Zapisz zatwierdzone"
  - Progress indicator dla operacji batch
  - Licznik zaakceptowanych/edytowanych/odrzuconych
- **Kluczowe komponenty**:
  - `FlashcardGenerationView` (główny widok React)
  - `SourceForm` (formularz wprowadzania tekstu)
  - `FlashcardProposalList` (lista propozycji)
  - `ProposalCard` (pojedyncza propozycja z akcjami)
  - `SaveSelectedBar` (pasek z przyciskami bulk save)
  - `ProgressIndicator` (dla operacji batch)
  - `ErrorMessage` (dla błędów 422 z szczegółami)
- **UX, dostępność i bezpieczeństwo**:
  - Stan każdej propozycji przechowywany w React state (lub localStorage jako fallback)
  - Bulk save przez `/api/flashcards/batch` z filtrowaniem tylko zaakceptowanych/edytowanych
  - Obsługa błędów 422 (partial validation failures) z wyświetleniem szczegółów (index, field, message)
  - Progress indicator i ostrzeżenia dla operacji batch
  - Rate limiting: 10 req/min user dla batch endpoints
  - Limit 50 fiszek na batch request (413 Payload Too Large)
  - Atomic operation: albo wszystkie fiszki są zapisane, albo żadna (409 Conflict przy przekroczeniu limitu 2000)
  - Komunikaty sukcesu z liczbą zapisanych fiszek

#### Widok 7: Powtórki na dziś (Priorytet 2)
- **Ścieżka**: `/reviews` lub `/reviews/today`
- **Główny cel**: Ekran powtórek z fiszkami do powtórki na dziś
- **Kluczowe informacje**:
  - Automatyczne tworzenie sesji przy załadowaniu (`POST /api/review-sessions`)
  - Przechowywanie sessionId w React state (lub localStorage jako fallback)
  - Lista fiszek do powtórki (max 100, sortowane: nextReviewAt rosnąco, potem createdAt rosnąco)
  - Licznik postępu: X/Y (liczba powtórek wykonanych / całkowita liczba fiszek na dziś)
  - Pusta lista: komunikat "Nie masz dziś fiszek do powtórki" z linkiem do dodania nowych fiszek
- **Kluczowe komponenty**:
  - `ReviewSessionView` (główny widok React)
  - `ReviewCard` (komponent pojedynczej fiszki)
  - `ProgressCounter` (licznik X/Y)
  - `EmptyState` (gdy brak fiszek)
  - `ErrorMessage` (dla błędów przy odczycie listy)
- **UX, dostępność i bezpieczeństwo**:
  - Skeleton loader podczas ładowania sesji
  - Przycisk "Spróbuj ponownie" przy błędach
  - Automatyczne wywołanie `/api/review-sessions/{sessionId}/complete` po zakończeniu
  - Obsługa przerwanej sesji: auto-complete przy opuszczeniu ekranu (lub zachowanie stanu w localStorage)
  - Focus management: przejście fokusu po każdej ocenie

#### Widok 8: Sesja powtórek – karta
- **Ścieżka**: `/reviews/session/:sessionId` (fullscreen overlay)
- **Główny cel**: Prezentacja pojedynczej fiszki w sesji powtórek
- **Kluczowe informacje**:
  - Bieżąca fiszka (najpierw front)
  - Przycisk/klawisz "Pokaż odpowiedź" (Space)
  - Po pokazaniu odpowiedzi: opcje oceny (trudne, średnie, łatwe) – klawisze 1/2/3
  - Licznik postępu: X/Y
  - Automatyczne przejście do kolejnej fiszki po wybraniu oceny
- **Kluczowe komponenty**:
  - `ReviewCard` (komponent pojedynczej fiszki)
  - `RevealButton` (przycisk "Pokaż odpowiedź")
  - `DifficultyButtons` (trzy duże przyciski: trudne, średnie, łatwe)
  - `ProgressBar` (pasek postępu)
  - `KeyboardShortcuts` (wizualne wskazówki: Space, 1/2/3)
- **UX, dostępność i bezpieczeństwo**:
  - Fullscreen overlay zasłaniający navbar dla pełnego skupienia
  - Duże hit-targets na mobile (min. 44×44px)
  - Obsługa gestów (swipe left/right jako alternatywa dla przycisków)
  - ARIA-live region dla licznika postępu
  - Klawiatura: Space = pokaż odpowiedź, 1/2/3 = ocena trudności
  - Wizualne wskazówki skrótów klawiszowych (tooltips lub mały tekst)
  - Automatyczne przejście do kolejnej fiszki po zapisie oceny
  - Komunikaty błędów inline przy błędach zapisu (z możliwością ponowienia)
  - Po zakończeniu sesji (X = Y): komunikat o ukończeniu z linkiem do dashboardu

### 2.3 Widoki pomocnicze (Priorytet 2)

#### Widok 9: Ustawienia konta
- **Ścieżka**: `/settings`
- **Główny cel**: Zmiana hasła i usunięcie konta
- **Kluczowe informacje**:
  - Sekcja danych dostępowych (email w formie tylko do odczytu)
  - Sekcja zmiany hasła (US-007):
    - Formularz: aktualne hasło, nowe hasło, potwierdzenie
    - Walidacja: aktualne hasło wymagane, nowe hasło min. 8 znaków
  - Sekcja usunięcia konta (US-008):
    - Przycisk "Usuń konto"
    - Modal z ostrzeżeniem o nieodwracalnym usunięciu
    - Wymagane potwierdzenie (wpisanie "USUŃ" lub hasła)
- **Kluczowe komponenty**:
  - `SettingsLayout` (layout strony)
  - `ChangePasswordForm` (React component)
  - `DeleteAccountDialog` (AlertDialog Shadcn/ui)
  - `FormError`
- **UX, dostępność i bezpieczeństwo**:
  - Próby wejścia bez zalogowania przekierowują na `/auth/login`
  - Walidacja inline dla formularza zmiany hasła
  - Modal usunięcia konta z focus trap
  - Wymagane potwierdzenie przed usunięciem (zabezpieczenie przed przypadkowym kliknięciem)
  - Po usunięciu konta przekierowanie na `/auth/login` z komunikatem
  - WCAG focus management

#### Widok 10: FAQ / Pomoc
- **Ścieżka**: `/help`
- **Główny cel**: Odpowiedzi na podstawowe pytania i możliwość zgłoszenia feedbacku
- **Kluczowe informacje**:
  - Lista FAQ z najczęstszymi pytaniami (np. jak dodać fiszkę, jak działa powtórka)
  - Link "Zgłoś błąd/feedback" prowadzący do mailto lub formularza kontaktowego
- **Kluczowe komponenty**:
  - `HelpLayout` (layout strony)
  - `FAQAccordion` (Shadcn/ui Accordion)
  - `FeedbackLink` (link mailto lub formularz)
- **UX, dostępność i bezpieczeństwo**:
  - Dostępność nagłówków (semantyczne h2/h3)
  - Semantyka HTML dla listy FAQ
  - Formularz feedbacku z walidacją (jeśli nie mailto)

#### Widok 11: Strona główna / Landing
- **Ścieżka**: `/` lub `/index`
- **Główny cel**: Strona powitalna dla niezalogowanych użytkowników
- **Kluczowe informacje**:
  - Krótki opis produktu
  - Przyciski: "Zaloguj się", "Zarejestruj się"
  - Link do FAQ
- **Kluczowe komponenty**:
  - `Welcome` (Astro component)
  - `Button` (Shadcn/ui)
- **UX, dostępność i bezpieczeństwo**:
  - Prosty, nieprzytłaczający interfejs
  - CTA buttons z wyraźnym kontrastem

#### Widok 12: 404 / Błędy
- **Ścieżka**: `/*` (catch-all)
- **Główny cel**: Informacja o błędzie lub nieistniejącej stronie
- **Kluczowe informacje**:
  - Kod błędu (404, 500, etc.)
  - Komunikat: "Coś poszło nie tak. Spróbuj odświeżyć stronę lub zalogować się ponownie"
  - Link do dashboardu lub strony głównej
- **Kluczowe komponenty**:
  - `ErrorLayout` (layout błędu)
  - `ErrorBoundary` (React Error Boundary dla błędów frontendu)
- **UX, dostępność i bezpieczeństwo**:
  - Brak przecieków serwerowych (nie ujawnianie szczegółów błędów)
  - ARIA role="alert" dla komunikatów błędów
  - Globalny Error Boundary dla nieobsłużonych błędów React

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ "Nowy użytkownik"

```
/ → /auth/register → /auth/login → /flashcards/generate → (generowanie i zapis fiszek) → /flashcards → /reviews → /reviews/session/:id → /flashcards
```

**Krok po kroku:**

1. **Strona główna** (`/`): Użytkownik widzi stronę powitalną z przyciskami "Zaloguj się" i "Zarejestruj się".
2. **Rejestracja** (`/auth/register`): Użytkownik zakłada konto (email + hasło + potwierdzenie).
3. **Logowanie** (`/auth/login`): Po rejestracji automatyczne logowanie lub przekierowanie do logowania.
4. **Generowanie fiszek** (`/flashcards/generate`): Główny przepływ po logowaniu – użytkownik wprowadza tekst źródłowy, generuje fiszki, recenzuje i zapisuje (bulk save).
5. **Lista fiszek** (`/flashcards`): Użytkownik widzi zapisane fiszki, może je przeglądać, edytować, usuwać.
6. **Powtórki** (`/reviews`): Gdy `nextReviewAt ≤ dziś`, użytkownik widzi listę fiszek do powtórki.
7. **Sesja powtórek** (`/reviews/session/:sessionId`): Użytkownik przechodzi przez fiszki, ocenia trudność, system aktualizuje `nextReviewAt`.
8. **Powrót do listy** (`/flashcards`): Po zakończeniu sesji użytkownik wraca do listy fiszek.

### 3.2 Przepływ "Zarządzanie fiszkami"

```
/flashcards → (wyszukiwanie / paginacja / sortowanie) → Edytuj (modal) → Zapisz
                                                      ↳ Usuń (AlertDialog) → Potwierdź
                                                      ↳ Dodaj fiszkę (modal) → Zapisz i dodaj kolejną / Zapisz i wróć
```

**Krok po kroku:**

1. **Lista fiszek** (`/flashcards`): Użytkownik widzi listę swoich fiszek z paginacją.
2. **Wyszukiwanie**: Użytkownik wpisuje frazę w pole wyszukiwania (debouncing 300ms), lista filtruje się automatycznie.
3. **Sortowanie**: Użytkownik wybiera sortowanie (created_at, next_review_at) i kierunek (asc, desc) przez Select.
4. **Edycja**: Użytkownik klika "Edytuj" na fiszce, otwiera się modal z formularzem, użytkownik zapisuje zmiany.
5. **Usuwanie**: Użytkownik klika "Usuń", otwiera się AlertDialog z potwierdzeniem, użytkownik potwierdza usunięcie.
6. **Dodawanie**: Użytkownik klika "Dodaj fiszkę", otwiera się modal z formularzem, użytkownik wybiera "Zapisz i dodaj kolejną" lub "Zapisz i wróć do listy".

### 3.3 Przepływ "Powtórki"

```
/flashcards → /reviews → (automatyczne utworzenie sesji) → /reviews/session/:sessionId → (ocena każdej fiszki) → (auto-complete) → /flashcards
```

**Krok po kroku:**

1. **Lista powtórek** (`/reviews`): Użytkownik widzi listę fiszek do powtórki na dziś (max 100), automatycznie tworzy się sesja.
2. **Sesja powtórek** (`/reviews/session/:sessionId`): Użytkownik widzi pierwszą fiszkę (front), klika Space lub przycisk "Pokaż odpowiedź", widzi back, wybiera trudność (1/2/3), automatycznie przechodzi do kolejnej fiszki.
3. **Zakończenie**: Po zakończeniu wszystkich fiszek automatycznie wywoływane jest `/api/review-sessions/{sessionId}/complete`, użytkownik widzi komunikat o ukończeniu.
4. **Powrót**: Użytkownik wraca do listy fiszek (`/flashcards`).

### 3.4 Przepływ "Ustawienia konta"

```
/flashcards → /settings → (zmiana hasła) | (usuń konto)
```

**Krok po kroku:**

1. **Ustawienia** (`/settings`): Użytkownik widzi sekcje: dane dostępowe (email read-only), zmiana hasła, usunięcie konta.
2. **Zmiana hasła**: Użytkownik wypełnia formularz (aktualne hasło, nowe hasło, potwierdzenie), zapisuje zmiany.
3. **Usunięcie konta**: Użytkownik klika "Usuń konto", otwiera się AlertDialog z ostrzeżeniem, użytkownik wpisuje "USUŃ" lub hasło, potwierdza usunięcie, konto i dane są trwale usunięte.

## 4. Układ i struktura nawigacji

### 4.1 Główna nawigacja (Navbar)

**Lokalizacja**: Topbar w `Layout.astro`, sticky na górze strony.

**Elementy nawigacji**:

- **Logo / Nazwa aplikacji**: Link do `/flashcards` (dashboard)
- **"Moje fiszki"**: Link do `/flashcards` (aktywny gdy na liście fiszek)
- **"Powtórki"**: Link do `/reviews` z badge pokazującym liczbę fiszek do powtórki na dziś (max 100)
- **"Pomoc"**: Link do `/help`
- **Avatar użytkownika** (dropdown):
  - "Ustawienia" → `/settings`
  - "Wyloguj" → wylogowanie i przekierowanie na `/auth/login`

**Komponenty**:
- `NavigationMenu` (Shadcn/ui) jako podstawa
- `Badge` (Shadcn/ui) dla licznika powtórek
- `DropdownMenu` (Shadcn/ui) dla menu użytkownika

**Zachowanie**:
- Badge powtórek aktualizowany w czasie rzeczywistym (React Query refetch)
- Dropdown zamyka się po kliknięciu opcji
- Wizualne wskazanie aktywnej sekcji (underline lub background)

### 4.2 Breadcrumbs

**Lokalizacja**: Tylko na liście fiszek (`/flashcards`) i ustawieniach (`/settings`).

**Struktura**:
- `/flashcards`: "Moje fiszki"
- `/settings`: "Ustawienia"

**Komponent**: `Breadcrumb` (Shadcn/ui) lub prosty tekst z separatorami.

### 4.3 Fullscreen overlay

**Lokalizacja**: Sesja powtórek (`/reviews/session/:sessionId`).

**Zachowanie**:
- Overlay zasłania navbar dla pełnego skupienia
- Przycisk "Zamknij" w lewym górnym rogu (opcjonalnie)
- ESC zamyka sesję (z potwierdzeniem, jeśli sesja nie zakończona)

### 4.4 Deep Linking

**Obsługa**:
- Bezpośrednie URL-e do edycji (`/flashcards/:id/edit`) otwierają modal po mountcie
- URL query parameters dla sortowania i filtrów (shareable links)
- React Router lub Astro routing dla SPA-like experience

## 5. Kluczowe komponenty

### 5.1 Komponenty autentykacji

#### `AuthLayout`
- **Opis**: Wspólny layout dla ekranów auth (centered card)
- **Źródło**: React component
- **Funkcjonalność**: Centrowany kontener z logo/nazwą aplikacji, tło z gradientem

#### `RegisterForm`, `LoginForm`, `ForgotPasswordForm`, `ResetPasswordForm`
- **Opis**: Formularze autentykacji z walidacją
- **Źródło**: React components z React Hook Form + Zod
- **Funkcjonalność**: Walidacja inline, komunikaty błędów, integracja z Supabase Auth

### 5.2 Komponenty fiszek

#### `FlashcardList`
- **Opis**: Główny komponent listy fiszek z React Query
- **Źródło**: React component
- **Funkcjonalność**: Paginacja, wyszukiwanie, sortowanie, integracja z `/api/flashcards`

#### `FlashcardTable` / `FlashcardCard`
- **Opis**: Responsywny widok listy (tabela desktop, karty mobile)
- **Źródło**: React components
- **Funkcjonalność**: Wyświetlanie fiszek z akcjami (edytuj, usuń), nawigacja klawiaturowa

#### `FlashcardForm`
- **Opis**: Reużywalny formularz tworzenia/edycji fiszki
- **Źródło**: React component z React Hook Form + Zod
- **Funkcjonalność**: 
  - Pola: front (1-120 znaków), back (1-300 znaków), subject (opcjonalny, ≤40 znaków)
  - Draft w localStorage (nice-to-have)
  - Klawiatura: Tab między polami, Ctrl+Enter = "zapisz i dodaj kolejną"
  - Integracja z `/api/flashcards` (POST dla create, PATCH dla update)

#### `FlashcardGenerationView`
- **Opis**: Główny widok generowania fiszek z AI
- **Źródło**: React component
- **Funkcjonalność**: 
  - Formularz wprowadzania tekstu źródłowego
  - Wywołanie endpointu generowania AI (Phase 2, obecnie mock)
  - Lista propozycji z recenzją jednostkową
  - Bulk save przez `/api/flashcards/batch`

#### `FlashcardProposalList`
- **Opis**: Lista propozycji fiszek z AI
- **Źródło**: React component
- **Funkcjonalność**: 
  - Wyświetlanie propozycji z stanami (pending, accepted, edited, rejected)
  - Akcje: Akceptuj, Edytuj (inline/modal), Odrzuć
  - Licznik zaakceptowanych/edytowanych/odrzuconych

#### `DeleteFlashcardDialog`
- **Opis**: Modal potwierdzający usunięcie fiszki
- **Źródło**: AlertDialog Shadcn/ui
- **Funkcjonalność**: 
  - Ostrzeżenie: "Na pewno chcesz usunąć tę fiszkę?"
  - Przyciski: "Anuluj", "Usuń"
  - Integracja z `/api/flashcards/{id}` (DELETE)

### 5.3 Komponenty powtórek

#### `ReviewSessionView`
- **Opis**: Główny widok sesji powtórek
- **Źródło**: React component
- **Funkcjonalność**: 
  - Automatyczne tworzenie sesji przy załadowaniu (`POST /api/review-sessions`)
  - Przechowywanie sessionId w React state (lub localStorage)
  - Wyświetlanie listy fiszek do powtórki (max 100)

#### `ReviewCard`
- **Opis**: Komponent pojedynczej fiszki w sesji powtórek
- **Źródło**: React component
- **Funkcjonalność**: 
  - Widok front → reveal → back
  - Animacja flip (opcjonalnie)
  - Obsługa gestów (swipe left/right)
  - Integracja z `/api/review-sessions/{sessionId}/answers` (POST)

#### `DifficultyButtons`
- **Opis**: Trzy duże przyciski oceny trudności
- **Źródło**: Shadcn/ui Button
- **Funkcjonalność**: 
  - Przyciski: "Trudne" (1), "Średnie" (2), "Łatwe" (3)
  - Klawiatura: 1/2/3
  - Duże hit-targets na mobile (min. 44×44px)

#### `ProgressCounter`
- **Opis**: Licznik postępu sesji (X/Y)
- **Źródło**: React component
- **Funkcjonalność**: 
  - Wyświetlanie: "X / Y" (liczba powtórek wykonanych / całkowita liczba fiszek)
  - ARIA-live region dla aktualizacji
  - Aktualizacja po każdej ocenie

### 5.4 Komponenty UI wielokrotnego użycia

#### `SearchBar`
- **Opis**: Pole wyszukiwania z debouncingiem
- **Źródło**: React component z Shadcn/ui Input
- **Funkcjonalność**: 
  - Debouncing 300ms
  - Integracja z URL query parameters
  - Przycisk wyczyszczenia (X)

#### `Pagination`
- **Opis**: Paginacja listy
- **Źródło**: Shadcn/ui Pagination
- **Funkcjonalność**: 
  - Przyciski "Poprzednie" / "Następne"
  - Wyświetlanie numeru strony
  - Integracja z URL query parameters (`page`, `pageSize`)

#### `SkeletonLoader`
- **Opis**: Placeholdery ładowania
- **Źródło**: Shadcn/ui Skeleton
- **Funkcjonalność**: 
  - Skeleton rows dla listy fiszek
  - Skeleton card dla formularzy

#### `ErrorMessage`
- **Opis**: Komponent do wyświetlania błędów inline
- **Źródło**: React component z Shadcn/ui Alert
- **Funkcjonalność**: 
  - Mapowanie kodów HTTP na komunikaty po polsku:
    - 400: błędy walidacji z szczegółami
    - 403: brak dostępu
    - 404: nie znaleziono
    - 409: limit 2000 fiszek
    - 422: błędy batch z listą szczegółów (index, field, message)
    - 429: rate limiting z informacją o odczekaniu
    - 500: błąd serwera
  - Exponential backoff dla automatycznych ponownych prób (429)
  - Przycisk "Spróbuj ponownie"

#### `ToastContainer`
- **Opis**: Globalne powiadomienia (success / error)
- **Źródło**: `sonner` lub Shadcn/ui Toast
- **Funkcjonalność**: 
  - Toast dla operacji CRUD (sukces/błąd)
  - Auto-dismiss po 3-5 sekundach
  - ARIA-live region

#### `ErrorBoundary`
- **Opis**: Globalny catcher błędów React
- **Źródło**: React Error Boundary
- **Funkcjonalność**: 
  - Wyświetla prosty ekran "Coś poszło nie tak. Spróbuj odświeżyć stronę lub zalogować się ponownie"
  - Zapisywanie logów błędu (konsola lub endpoint backendowy)

#### `EmptyState`
- **Opis**: Ekran pustego stanu
- **Źródło**: React component
- **Funkcjonalność**: 
  - Komunikat: "Nie masz fiszek do powtórki" / "Nie masz jeszcze fiszek"
  - Link do dodania nowych fiszek
  - Ikona ilustracyjna

### 5.5 Komponenty ustawień

#### `SettingsLayout`
- **Opis**: Layout strony ustawień
- **Źródło**: Astro component
- **Funkcjonalność**: Sekcje: dane dostępowe, zmiana hasła, usunięcie konta

#### `ChangePasswordForm`
- **Opis**: Formularz zmiany hasła
- **Źródło**: React component z React Hook Form + Zod
- **Funkcjonalność**: 
  - Pola: aktualne hasło, nowe hasło, potwierdzenie
  - Walidacja: aktualne hasło wymagane, nowe hasło min. 8 znaków
  - Integracja z Supabase Auth

#### `DeleteAccountDialog`
- **Opis**: Modal usunięcia konta
- **Źródło**: AlertDialog Shadcn/ui
- **Funkcjonalność**: 
  - Ostrzeżenie o nieodwracalnym usunięciu
  - Wymagane potwierdzenie (wpisanie "USUŃ" lub hasła)
  - Integracja z Supabase Auth (usunięcie konta i danych)

## 6. Mapowanie historyjek użytkownika do architektury UI

### US-001 Rejestracja konta
- **Widok**: `/auth/register`
- **Komponenty**: `AuthLayout`, `RegisterForm`, `EmailInput`, `PasswordInput`, `FormError`
- **Funkcjonalność**: Formularz z walidacją, komunikaty błędów, automatyczne logowanie lub przekierowanie

### US-002 Logowanie
- **Widok**: `/auth/login`
- **Komponenty**: `AuthLayout`, `LoginForm`, `EmailInput`, `PasswordInput`, `FormError`
- **Funkcjonalność**: Formularz z walidacją, neutralne komunikaty błędów, przekierowanie na `/flashcards`

### US-003 Kolekcje reguł
- **Status**: Poza zakresem MVP (Phase 2)

### US-004 Bezpieczny dostęp i uwierzytelnianie
- **Widoki**: `/auth/login`, `/auth/register`, `/auth/forgot`, `/auth/reset`
- **Komponenty**: Wszystkie komponenty autentykacji
- **Funkcjonalność**: Dedykowane strony, bezpieczne sesje/tokeny, brak zewnętrznych serwisów logowania

### US-005 Wylogowanie
- **Widok**: Dropdown w navbarze
- **Komponenty**: `NavigationMenu`, `DropdownMenu`
- **Funkcjonalność**: Przycisk "Wyloguj" w dropdownie użytkownika, unieważnienie sesji, przekierowanie na `/auth/login`

### US-006 Reset hasła
- **Widoki**: `/auth/forgot`, `/auth/reset`
- **Komponenty**: `ForgotPasswordForm`, `ResetPasswordForm`
- **Funkcjonalność**: Link "Zapomniałem hasła" na ekranie logowania, wysłanie maila, formularz ustawienia nowego hasła

### US-007 Zmiana hasła
- **Widok**: `/settings`
- **Komponenty**: `ChangePasswordForm`
- **Funkcjonalność**: Formularz w ustawieniach konta, walidacja aktualnego hasła

### US-008 Usunięcie konta i danych
- **Widok**: `/settings`
- **Komponenty**: `DeleteAccountDialog`
- **Funkcjonalność**: Opcja "Usuń konto" w ustawieniach, modal z potwierdzeniem, trwałe usunięcie konta i danych

### US-009 Przeglądanie listy fiszek
- **Widok**: `/flashcards`
- **Komponenty**: `FlashcardList`, `FlashcardTable` / `FlashcardCard`, `Pagination`, `EmptyState`
- **Funkcjonalność**: Lista fiszek z paginacją (50 desktop / 25 mobile), wyświetlanie front/back/subject, ekran pustego stanu

### US-010 Wyszukiwanie fiszek po treści
- **Widok**: `/flashcards`
- **Komponenty**: `SearchBar`
- **Funkcjonalność**: Pole wyszukiwania z debouncingiem 300ms, filtrowanie po front/back, URL query parameters

### US-011 Dodanie nowej fiszki ręcznie
- **Widok**: `/flashcards` (modal)
- **Komponenty**: `FlashcardForm` (modal Dialog)
- **Funkcjonalność**: Przycisk "Dodaj fiszkę", formularz z polami front/back/subject, opcje "Zapisz i dodaj kolejną" / "Zapisz i wróć do listy", klawiatura (Tab, Ctrl+Enter)

### US-012 Edycja istniejącej fiszki
- **Widok**: `/flashcards` (modal)
- **Komponenty**: `FlashcardForm` (modal Dialog)
- **Funkcjonalność**: Akcja "Edytuj" na liście, modal z pre-filled formularzem, walidacja, optimistic update

### US-013 Usunięcie fiszki
- **Widok**: `/flashcards` (AlertDialog)
- **Komponenty**: `DeleteFlashcardDialog`
- **Funkcjonalność**: Akcja "Usuń" na liście, modal z potwierdzeniem, trwałe usunięcie

### US-014 Przegląd fiszek do powtórki na dziś
- **Widok**: `/reviews`
- **Komponenty**: `ReviewSessionView`, `EmptyState`
- **Funkcjonalność**: Lista fiszek do powtórki (max 100), automatyczne tworzenie sesji, ekran pustego stanu

### US-015 Powtarzanie pojedynczej fiszki
- **Widok**: `/reviews/session/:sessionId`
- **Komponenty**: `ReviewCard`, `RevealButton`
- **Funkcjonalność**: Widok front → reveal → back, przycisk/klawisz "Pokaż odpowiedź" (Space), przyciski oceny dostępne po odsłonięciu

### US-016 Ocenianie trudności fiszki i planowanie powtórki
- **Widok**: `/reviews/session/:sessionId`
- **Komponenty**: `DifficultyButtons`, `ReviewCard`
- **Funkcjonalność**: Trzy opcje (trudne, średnie, łatwe) – klawisze 1/2/3, zapis wyniku, aktualizacja nextReviewAt, automatyczne przejście do kolejnej fiszki

### US-017 Informacja o postępie w sesji powtórek
- **Widok**: `/reviews/session/:sessionId`
- **Komponenty**: `ProgressCounter`, `ProgressBar`
- **Funkcjonalność**: Licznik X/Y, aktualizacja po każdej ocenie, komunikat o ukończeniu po zakończeniu sesji

### US-018 Obsługa błędów przy zapisie fiszki
- **Widoki**: Wszystkie widoki z formularzami fiszek
- **Komponenty**: `ErrorMessage`, `ToastContainer`
- **Funkcjonalność**: Komunikaty błędów inline, zachowanie danych w formularzu, przycisk "Spróbuj ponownie"

### US-019 Obsługa braku internetu podczas pracy
- **Widoki**: Wszystkie widoki wymagające komunikacji z API
- **Komponenty**: `ErrorMessage`, `ToastContainer`
- **Funkcjonalność**: Wykrywanie braku połączenia, komunikat "offline", blokada zapisu, próba automatycznego ponowienia po odzyskaniu połączenia

### US-020 Przegląd i edycja ustawień konta
- **Widok**: `/settings`
- **Komponenty**: `SettingsLayout`, `ChangePasswordForm`, `DeleteAccountDialog`
- **Funkcjonalność**: Sekcje: dane dostępowe (email read-only), zmiana hasła, usunięcie konta, przekierowanie na `/auth/login` bez zalogowania

### US-021 Przegląd FAQ i zgłoszenie feedbacku
- **Widok**: `/help`
- **Komponenty**: `HelpLayout`, `FAQAccordion`, `FeedbackLink`
- **Funkcjonalność**: Lista FAQ, link "Zgłoś błąd/feedback" (mailto lub formularz)

## 7. Zgodność z API

### 7.1 Endpointy flashcards

- **GET `/api/flashcards`**: Używany przez `FlashcardList` z React Query, parametry: `page`, `pageSize`, `search`, `subject`, `sort`, `order`
- **POST `/api/flashcards`**: Używany przez `FlashcardForm` (create single)
- **POST `/api/flashcards/batch`**: Używany przez `FlashcardGenerationView` (bulk save)
- **GET `/api/flashcards/{id}`**: Używany przez `FlashcardForm` (edit, pre-fill)
- **PATCH `/api/flashcards/{id}`**: Używany przez `FlashcardForm` (update)
- **DELETE `/api/flashcards/{id}`**: Używany przez `DeleteFlashcardDialog`

### 7.2 Endpointy review sessions

- **POST `/api/review-sessions`**: Używany przez `ReviewSessionView` (start session)
- **POST `/api/review-sessions/{sessionId}/answers`**: Używany przez `ReviewCard` (submit answer)
- **POST `/api/review-sessions/{sessionId}/complete`**: Używany przez `ReviewSessionView` (complete session)
- **GET `/api/reviews/today`**: Opcjonalnie używany przez `ReviewSessionView` (convenience endpoint)

### 7.3 Endpointy autentykacji

- **Supabase Auth**: Używany przez wszystkie komponenty autentykacji (register, login, reset password, change password, delete account)

### 7.4 Obsługa błędów API

- **400 Bad Request**: Walidacja nie powiodła się – `ErrorMessage` z szczegółami
- **403 Forbidden**: Brak dostępu – `ErrorMessage` z komunikatem "Brak dostępu"
- **404 Not Found**: Nie znaleziono – `ErrorMessage` z komunikatem "Nie znaleziono"
- **409 Conflict**: Limit 2000 fiszek przekroczony – `ErrorMessage` z komunikatem i zachętą do porządków
- **413 Payload Too Large**: Batch przekracza 50 fiszek – `ErrorMessage` z komunikatem
- **422 Unprocessable Entity**: Błędy batch z szczegółami – `ErrorMessage` z listą błędów (index, field, message)
- **429 Too Many Requests**: Rate limiting – `ErrorMessage` z informacją o odczekaniu, exponential backoff
- **500 Internal Server Error**: Błąd serwera – `ErrorMessage` z komunikatem "Błąd serwera", przycisk "Spróbuj ponownie"

## 8. Punkty bólu użytkownika i rozwiązania UI

### 8.1 Frustracja związana z ręcznym przepisywaniem materiałów

**Rozwiązanie**: Widok generowania fiszek z AI (`/flashcards/generate`) jako główny przepływ po logowaniu, umożliwiający szybkie tworzenie wielu fiszek z tekstu źródłowego.

### 8.2 Chaos w fiszkach (brak prostych kategorii i wyszukiwarki)

**Rozwiązanie**: 
- Pole `subject` (opcjonalne) dla kategoryzacji
- Wyszukiwanie z debouncingiem 300ms przeszukujące front i back
- Sortowanie i filtry przez URL query parameters (shareable links)

### 8.3 Brak prostego, zintegrowanego widoku "co dzisiaj powtórzyć"

**Rozwiązanie**: 
- Dedykowany ekran `/reviews` z listą fiszek do powtórki na dziś
- Badge w nawigacji pokazujący liczbę fiszek do powtórki
- Automatyczne tworzenie sesji przy załadowaniu

### 8.4 Niska motywacja i tendencja do odkładania nauki

**Rozwiązanie**: 
- Licznik postępu (X/Y) w sesji powtórek dający poczucie progresu
- Komunikat o ukończeniu powtórek na dziś
- Prosty, nieprzytłaczający interfejs

### 8.5 Czasochłonność ręcznego wprowadzania fiszek

**Rozwiązanie**: 
- Formularz z opcją "Zapisz i dodaj kolejną" (Ctrl+Enter)
- Draft w localStorage (nice-to-have) dla zachowania danych
- Bulk save dla fiszek generowanych przez AI

### 8.6 Brak przypomnień o powtórkach

**Rozwiązanie**: 
- Badge w nawigacji pokazujący liczbę fiszek do powtórki
- Dedykowany ekran `/reviews` z listą fiszek do powtórki

## 9. Edge cases i stany błędów

### 9.1 Brak fiszek do powtórki

**Obsługa**: `EmptyState` z komunikatem "Nie masz dziś fiszek do powtórki" i linkiem do dodania nowych fiszek.

### 9.2 Przekroczenie limitu 2000 fiszek

**Obsługa**: `ErrorMessage` z komunikatem 409 Conflict i zachętą do porządków (sugestie usunięcia starych fiszek).

### 9.3 Błąd przy odczycie listy powtórek

**Obsługa**: `ErrorMessage` z komunikatem błędu i przyciskiem "Spróbuj ponownie".

### 9.4 Przerwana sesja powtórek

**Obsługa**: Auto-complete przy opuszczeniu ekranu lub zachowanie stanu w localStorage (do ustalenia w implementacji).

### 9.5 Utrata połączenia podczas pracy

**Obsługa**: Wykrywanie braku połączenia, komunikat "offline", blokada zapisu, próba automatycznego ponowienia po odzyskaniu połączenia.

### 9.6 Błąd zapisu fiszki (500/timeout)

**Obsługa**: `ErrorMessage` z komunikatem błędu, zachowanie danych w formularzu, przycisk "Spróbuj ponownie".

### 9.7 Odświeżenie strony przy edycji

**Obsługa**: Ostrzeżenie o niezapisanych zmianach (lub lokalny draft jako nice-to-have).

### 9.8 Rate limiting (429)

**Obsługa**: `ErrorMessage` z informacją o odczekaniu, exponential backoff dla automatycznych ponownych prób.

### 9.9 Błędy batch (422)

**Obsługa**: `ErrorMessage` z listą szczegółów błędów (index, field, message) dla każdej fiszki w batchu.

### 9.10 Błędy krytyczne frontendu

**Obsługa**: Globalny `ErrorBoundary` wyświetlający prosty ekran "Coś poszło nie tak. Spróbuj odświeżyć stronę lub zalogować się ponownie", zapisywanie logów błędu.

---

**Zgodność z wymaganiami**: Architektura UI w pełni pokrywa wszystkie wymagania z PRD (US-001 do US-021), jest zgodna z planem API i uwzględnia decyzje z sesji planowania. Wszystkie widoki, komponenty i przepływy zostały zaprojektowane z naciskiem na minimalną frustrację użytkownika, dostępność i bezpieczeństwo.
