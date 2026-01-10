# Plan Testów - System Zarządzania Fiszami

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel Dokumentu
Niniejszy dokument stanowi kompleksowy plan testów dla aplikacji webowej do zarządzania fiszkami edukacyjnymi. Plan został opracowany w oparciu o analizę kodu źródłowego, architektury systemu oraz wykorzystywanych technologii.

### 1.2 Cele Testowania
Głównym celem testowania jest zapewnienie wysokiej jakości oprogramowania poprzez:

- **Weryfikację funkcjonalności**: Potwierdzenie, że wszystkie funkcje działają zgodnie z wymaganiami
- **Zapewnienie bezpieczeństwa**: Weryfikacja mechanizmów autentykacji, autoryzacji oraz ochrony danych
- **Sprawdzenie wydajności**: Ocena czasu odpowiedzi, przepustowości oraz skalowalności systemu
- **Walidację integracji**: Weryfikacja poprawności współpracy między komponentami systemu
- **Zapewnienie użyteczności**: Sprawdzenie, czy interfejs użytkownika jest intuicyjny i responsywny
- **Ochrona przed regresją**: Zapewnienie, że nowe zmiany nie psują istniejących funkcjonalności

### 1.3 Zakres Testowania
Plan testów obejmuje:

- **Testy jednostkowe**: Komponenty React, serwisy, funkcje pomocnicze
- **Testy integracyjne**: API endpoints, integracja z Supabase, middleware
- **Testy end-to-end**: Pełne przepływy użytkownika (Playwright)
- **Testy bezpieczeństwa**: Autentykacja, autoryzacja, RLS policies, walidacja danych
- **Testy wydajnościowe**: Czas odpowiedzi API, obciążenie bazy danych
- **Testy użyteczności**: Responsywność UI, dostępność, kompatybilność przeglądarek

## 2. Zakres Testów

### 2.1 Moduły Podlegające Testowaniu

#### 2.1.1 Moduł Autentykacji
- Rejestracja użytkownika
- Logowanie użytkownika
- Wylogowanie użytkownika
- Resetowanie hasła (forgot password)
- Aktualizacja hasła (reset password)
- Synchronizacja sesji między klientem a serwerem
- Middleware ochrony tras

#### 2.1.2 Moduł Zarządzania Fiszami
- Tworzenie pojedynczej fiszki (POST /api/flashcards)
- Tworzenie wielu fiszek w batch (POST /api/flashcards/batch)
- Pobieranie listy fiszek z paginacją (GET /api/flashcards)
- Pobieranie pojedynczej fiszki (GET /api/flashcards/{id})
- Aktualizacja fiszki - pełna (PUT /api/flashcards/{id})
- Aktualizacja fiszki - częściowa (PATCH /api/flashcards/{id})
- Usuwanie fiszki (DELETE /api/flashcards/{id})
- Wyszukiwanie i filtrowanie fiszek
- Sortowanie fiszek
- Walidacja limitów (max 2000 fiszek na użytkownika)

#### 2.1.3 Moduł Generowania Fiszek z AI
- Generowanie propozycji fiszek z tekstu źródłowego
- Edycja wygenerowanych propozycji
- Zaznaczanie i zapisywanie wybranych propozycji
- Walidacja danych wejściowych (długość tekstu, liczba fiszek)

#### 2.1.4 Moduł Spaced Repetition
- System powtórek (next_review_at, ease_factor, review_count)
- Aktualizacja parametrów po recenzji

#### 2.1.5 Moduł Interfejsu Użytkownika
- Komponenty React (formularze, listy, modale)
- Komponenty Shadcn/ui
- Responsywność (desktop, tablet, mobile)
- Dostępność (a11y)
- Kompatybilność przeglądarek

### 2.2 Moduły Wyłączone z Testowania
- Konfiguracja infrastruktury (DigitalOcean, Docker)
- Migracje bazy danych (testowane osobno w środowisku deweloperskim)
- Konfiguracja CI/CD (testowana osobno w pipeline)

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy Jednostkowe (Unit Tests)

#### 3.1.1 Komponenty React
**Narzędzie**: Vitest + React Testing Library

**Zakres**:
- Komponenty autentykacji:
  - `LoginForm.tsx` - walidacja formularza, obsługa błędów
  - `RegisterForm.tsx` - walidacja, potwierdzenie hasła
  - `ForgotForm.tsx` - walidacja email
  - `ResetForm.tsx` - walidacja nowego hasła
  - `AuthInitializer.tsx` - inicjalizacja stanu autentykacji

- Komponenty fiszek:
  - `FlashcardForm.tsx` - walidacja formularza, tryby edycji/tworzenia
  - `FlashcardList.tsx` - renderowanie listy, paginacja
  - `FlashcardCard.tsx` - wyświetlanie pojedynczej fiszki
  - `FlashcardTable.tsx` - renderowanie tabeli, sortowanie
  - `SearchBar.tsx` - wyszukiwanie, debounce
  - `SortSelect.tsx` - zmiana sortowania
  - `Pagination.tsx` - nawigacja między stronami
  - `DeleteFlashcardDialog.tsx` - potwierdzenie usunięcia

- Komponenty generowania:
  - `SourceForm.tsx` - walidacja tekstu źródłowego
  - `ProposalList.tsx` - wyświetlanie propozycji
  - `ProposalCard.tsx` - pojedyncza propozycja, edycja
  - `SaveSelectedBar.tsx` - zapisywanie zaznaczonych

- Komponenty nawigacji:
  - `Header.astro` - nawigacja, stan użytkownika
  - `LogoutButton.tsx` - wylogowanie

#### 3.1.2 Serwisy i Logika Biznesowa
**Narzędzie**: Vitest

**Zakres**:
- `FlashcardService`:
  - `getFlashcards()` - paginacja, filtrowanie, sortowanie
  - `getFlashcardById()` - pobieranie pojedynczej fiszki
  - `createFlashcard()` - tworzenie, walidacja limitów
  - `createFlashcardsBatch()` - batch operations, walidacja
  - `updateFlashcard()` - aktualizacja pełna i częściowa
  - `deleteFlashcard()` - usuwanie
  - `checkFlashcardLimit()` - weryfikacja limitu 2000 fiszek
  - `generateContentHash()` - wykrywanie duplikatów

#### 3.1.3 Walidacja i Schematy
**Narzędzie**: Vitest + Zod

**Zakres**:
- `flashcard.schemas.ts`:
  - `CreateFlashcardSchema` - walidacja tworzenia
  - `BatchCreateFlashcardsSchema` - walidacja batch
  - `FlashcardQuerySchema` - walidacja parametrów zapytania
  - `UpdateFlashcardSchema` - walidacja aktualizacji
  - `UuidParamSchema` - walidacja UUID

- `auth.schemas.ts`:
  - `loginSchema` - walidacja logowania
  - `registerSchema` - walidacja rejestracji
  - `forgotPasswordSchema` - walidacja resetu hasła
  - `resetPasswordSchema` - walidacja nowego hasła

#### 3.1.4 Hooks i Stores
**Narzędzie**: Vitest

**Zakres**:
- `useDebounce.ts` - debounce hook
- `useMediaQuery.ts` - responsive hook
- `useFlashcardQueryParams.ts` - zarządzanie parametrami URL
- `useFlashcardMutations.ts` - mutacje React Query
- `auth.store.ts` (Zustand):
  - `login()` - logowanie, synchronizacja sesji
  - `register()` - rejestracja
  - `logout()` - wylogowanie
  - `resetPassword()` - reset hasła
  - `updatePassword()` - aktualizacja hasła
  - `initialize()` - inicjalizacja stanu

- `generate.store.ts` (Zustand):
  - `generate()` - generowanie propozycji
  - `toggleSelect()` - zaznaczanie/odznaczanie
  - `updateProposal()` - edycja propozycji
  - `saveSelected()` - zapisywanie zaznaczonych

#### 3.1.5 Funkcje Pomocnicze
**Narzędzie**: Vitest

**Zakres**:
- `utils.ts` - funkcje pomocnicze
- Mapowanie danych (DTO ↔ Entity)
- Formatowanie dat
- Obsługa błędów

### 3.2 Testy Integracyjne (Integration Tests)

#### 3.2.1 API Endpoints
**Narzędzie**: Vitest + Supertest lub bezpośrednie wywołania Astro API

**Zakres**:

**GET /api/flashcards**:
- Pobieranie listy z domyślnymi parametrami
- Paginacja (page, pageSize)
- Alternatywna paginacja (limit)
- Wyszukiwanie (search)
- Filtrowanie po temacie (subject)
- Sortowanie (sort, order)
- Walidacja parametrów zapytania
- Obsługa błędów (401, 400, 500)
- Cache headers

**POST /api/flashcards**:
- Tworzenie pojedynczej fiszki
- Walidacja danych wejściowych
- Obsługa błędów walidacji
- Sprawdzanie limitu 2000 fiszek
- Zwracanie poprawnego statusu (201)
- Header Location

**POST /api/flashcards/batch**:
- Tworzenie wielu fiszek (1-50)
- Walidacja każdej fiszki w batch
- Zwracanie szczegółowych błędów walidacji (422)
- Obsługa pustego batch (400)
- Obsługa batch > 50 (413)
- Sprawdzanie limitu 2000 fiszek
- Transakcyjność operacji

**GET /api/flashcards/{id}**:
- Pobieranie istniejącej fiszki
- Obsługa nieistniejącej fiszki (404)
- Walidacja UUID (400)
- Cache headers

**PUT /api/flashcards/{id}**:
- Pełna aktualizacja fiszki
- Walidacja wszystkich pól
- Obsługa nieistniejącej fiszki (404)
- Obsługa nieprawidłowego UUID (400)

**PATCH /api/flashcards/{id}**:
- Częściowa aktualizacja fiszki
- Aktualizacja pojedynczego pola
- Aktualizacja wielu pól
- Walidacja minimalnych wymagań
- Obsługa nieistniejącej fiszki (404)

**DELETE /api/flashcards/{id}**:
- Usuwanie istniejącej fiszki
- Obsługa nieistniejącej fiszki (404)
- Zwracanie statusu 204
- Weryfikacja usunięcia

**POST /api/auth/session**:
- Synchronizacja sesji
- Walidacja tokenów
- Ustawianie cookies
- Weryfikacja sesji

#### 3.2.2 Integracja z Supabase
**Narzędzie**: Vitest + Supabase Client (testowy)

**Zakres**:
- Połączenie z bazą danych
- Wykonywanie zapytań
- Row Level Security (RLS) policies:
  - Użytkownik widzi tylko swoje fiszki
  - Użytkownik może modyfikować tylko swoje fiszki
  - Nieautoryzowany dostęp jest blokowany
- Transakcje
- Obsługa błędów bazy danych

#### 3.2.3 Middleware
**Narzędzie**: Vitest + Astro Middleware Testing

**Zakres**:
- Ochrona tras wymagających autentykacji
- Publiczne trasy (/, /auth/*, /flashcards/generate)
- Przekierowanie do logowania
- Przekazywanie parametru redirect
- Ustawianie kontekstu użytkownika
- Obsługa sesji przez cookies

### 3.3 Testy End-to-End (E2E Tests)

#### 3.3.1 Przepływy Autentykacji
**Narzędzie**: Playwright

**Zakres**:

**Rejestracja**:
- Wypełnienie formularza rejestracji
- Walidacja formularza (email, hasło, potwierdzenie)
- Obsługa błędów walidacji
- Sukces rejestracji
- Przekierowanie po rejestracji
- Potwierdzenie email (jeśli wymagane)

**Logowanie**:
- Wypełnienie formularza logowania
- Logowanie z poprawnymi danymi
- Przekierowanie do /flashcards
- Obsługa nieprawidłowych danych
- Wyświetlanie komunikatów błędów
- Przycisk submit jest wyłączony podczas ładowania
- Obsługa parametru redirect

**Wylogowanie**:
- Kliknięcie przycisku wylogowania
- Weryfikacja wylogowania
- Przekierowanie do strony głównej
- Brak dostępu do chronionych tras

**Reset Hasła**:
- Wypełnienie formularza forgot password
- Wysłanie linku resetującego
- Otwarcie linku resetującego
- Wypełnienie nowego hasła
- Potwierdzenie zmiany hasła
- Przekierowanie po zmianie hasła

#### 3.3.2 Przepływy Zarządzania Fiszkami
**Narzędzie**: Playwright

**Zakres**:

**Tworzenie Fiszki**:
- Nawigacja do formularza tworzenia
- Wypełnienie formularza (front, back, subject)
- Zapisanie fiszki
- Weryfikacja pojawienia się na liście
- Obsługa błędów walidacji

**Edycja Fiszki**:
- Otwarcie formularza edycji
- Modyfikacja danych
- Zapisanie zmian
- Weryfikacja zaktualizowanych danych

**Usuwanie Fiszki**:
- Otwarcie dialogu usuwania
- Potwierdzenie usunięcia
- Weryfikacja usunięcia z listy
- Anulowanie usuwania

**Lista Fiszek**:
- Wyświetlanie listy fiszek
- Paginacja (następna/poprzednia strona)
- Wyszukiwanie fiszek
- Filtrowanie po temacie
- Sortowanie (data utworzenia, data powtórki)
- Przełączanie widoku (karty/tabela)
- Responsywność na różnych urządzeniach

**Batch Operations**:
- Generowanie wielu fiszek z AI
- Zaznaczanie wielu propozycji
- Zapisywanie zaznaczonych
- Weryfikacja utworzonych fiszek

#### 3.3.3 Przepływy Generowania z AI
**Narzędzie**: Playwright

**Zakres**:
- Nawigacja do strony generowania
- Wklejenie tekstu źródłowego
- Ustawienie liczby fiszek (1-20)
- Ustawienie tematu (opcjonalnie)
- Wygenerowanie propozycji
- Wyświetlanie propozycji
- Edycja pojedynczej propozycji
- Zaznaczanie/odznaczanie propozycji
- Zapisywanie zaznaczonych propozycji
- Przekierowanie do listy fiszek
- Obsługa błędów (za krótki tekst, za długi tekst)

### 3.4 Testy Bezpieczeństwa (Security Tests)

#### 3.4.1 Autentykacja i Autoryzacja
**Zakres**:
- Próba dostępu do chronionych tras bez autentykacji
- Próba dostępu do cudzych danych (flashcards)
- Próba modyfikacji cudzych danych
- Wygaśnięcie sesji
- Odświeżanie tokenów
- CSRF protection
- XSS protection

#### 3.4.2 Walidacja Danych Wejściowych
**Zakres**:
- SQL Injection (przez Supabase - powinno być chronione)
- XSS w polach tekstowych
- Przepełnienie bufora (długie stringi)
- Nieprawidłowe typy danych
- Brakujące wymagane pola
- Nieprawidłowe formaty (UUID, email)

#### 3.4.3 Row Level Security (RLS)
**Zakres**:
- Weryfikacja, że użytkownik widzi tylko swoje fiszki
- Weryfikacja, że użytkownik nie może modyfikować cudzych fiszek
- Weryfikacja, że nieautoryzowany użytkownik nie ma dostępu

### 3.5 Testy Wydajnościowe (Performance Tests)

#### 3.5.1 Wydajność API
**Narzędzie**: k6, Artillery, lub Postman/Newman

**Zakres**:
- Czas odpowiedzi GET /api/flashcards (różne rozmiary list)
- Czas odpowiedzi POST /api/flashcards
- Czas odpowiedzi POST /api/flashcards/batch (różne rozmiary)
- Czas odpowiedzi przy dużych zbiorach danych (2000 fiszek)
- Współbieżne żądania
- Obciążenie bazy danych

#### 3.5.2 Wydajność Frontendu
**Narzędzie**: Lighthouse, WebPageTest

**Zakres**:
- Czas ładowania strony (First Contentful Paint)
- Czas interaktywności (Time to Interactive)
- Rozmiar bundle JavaScript
- Optymalizacja obrazów
- Lazy loading komponentów

### 3.6 Testy Użyteczności (Usability Tests)

#### 3.6.1 Responsywność
**Zakres**:
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)
- Przełączanie widoków (karty/tabela) na różnych urządzeniach

#### 3.6.2 Dostępność (a11y)
**Narzędzie**: axe-core, Lighthouse Accessibility

**Zakres**:
- Kontrast kolorów
- Nawigacja klawiaturą
- Screen reader compatibility
- ARIA labels
- Focus management

#### 3.6.3 Kompatybilność Przeglądarek
**Zakres**:
- Chrome (ostatnie 2 wersje)
- Firefox (ostatnie 2 wersje)
- Safari (ostatnie 2 wersje)
- Edge (ostatnie 2 wersje)

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Scenariusz: Pełny Przepływ Tworzenia i Zarządzania Fiszką

**Kroki**:
1. Użytkownik loguje się do systemu
2. Użytkownik nawiguje do listy fiszek
3. Użytkownik klika przycisk "Dodaj fiszkę"
4. Użytkownik wypełnia formularz:
   - Front: "Co to jest closure w JavaScript?"
   - Back: "Closure to funkcja, która ma dostęp do zmiennych z zakresu zewnętrznego..."
   - Subject: "JavaScript"
5. Użytkownik zapisuje fiszkę
6. Użytkownik weryfikuje, że fiszka pojawiła się na liście
7. Użytkownik otwiera fiszkę do edycji
8. Użytkownik modyfikuje pole "Back"
9. Użytkownik zapisuje zmiany
10. Użytkownik weryfikuje zaktualizowaną fiszkę
11. Użytkownik usuwa fiszkę
12. Użytkownik weryfikuje, że fiszka zniknęła z listy

**Oczekiwane rezultaty**:
- Wszystkie operacje wykonują się poprawnie
- Dane są zapisywane w bazie danych
- Interfejs reaguje na akcje użytkownika
- Komunikaty błędów są wyświetlane w razie potrzeby

### 4.2 Scenariusz: Generowanie Fiszek z AI i Zapisywanie

**Kroki**:
1. Użytkownik loguje się do systemu
2. Użytkownik nawiguje do strony generowania
3. Użytkownik wkleja tekst źródłowy (min. 20 znaków)
4. Użytkownik ustawia liczbę fiszek (np. 5)
5. Użytkownik ustawia temat (opcjonalnie)
6. Użytkownik klika "Generuj"
7. System wyświetla propozycje fiszek
8. Użytkownik zaznacza 3 z 5 propozycji
9. Użytkownik edytuje jedną z zaznaczonych propozycji
10. Użytkownik klika "Zapisz zaznaczone"
11. System zapisuje 3 fiszki
12. Użytkownik jest przekierowany do listy fiszek
13. Użytkownik weryfikuje, że 3 fiszki są na liście

**Oczekiwane rezultaty**:
- Propozycje są generowane poprawnie
- Użytkownik może edytować propozycje
- Zaznaczone fiszki są zapisywane
- Edytowane propozycje zachowują zmiany

### 4.3 Scenariusz: Wyszukiwanie i Filtrowanie Fiszek

**Kroki**:
1. Użytkownik loguje się do systemu
2. Użytkownik ma w systemie 50 fiszek z różnymi tematami
3. Użytkownik wpisuje w wyszukiwarkę "JavaScript"
4. System filtruje fiszki zawierające "JavaScript" w polu front lub back
5. Użytkownik wybiera filtr "Subject: JavaScript"
6. System wyświetla tylko fiszki z tematem "JavaScript"
7. Użytkownik zmienia sortowanie na "Data powtórki"
8. System sortuje fiszki według next_review_at
9. Użytkownik przechodzi do następnej strony
10. System wyświetla kolejne fiszki z zachowaniem filtrów

**Oczekiwane rezultaty**:
- Wyszukiwanie działa w czasie rzeczywistym (z debounce)
- Filtry są stosowane poprawnie
- Sortowanie działa poprawnie
- Paginacja zachowuje filtry i sortowanie

### 4.4 Scenariusz: Osiągnięcie Limitu Fiszek

**Kroki**:
1. Użytkownik loguje się do systemu
2. Użytkownik ma 1999 fiszek w systemie
3. Użytkownik próbuje utworzyć 2 nowe fiszki
4. System pozwala na utworzenie pierwszej fiszki
5. System blokuje utworzenie drugiej fiszki
6. System wyświetla komunikat o przekroczeniu limitu
7. Użytkownik próbuje utworzyć batch z 5 fiszkami
8. System blokuje operację i wyświetla komunikat

**Oczekiwane rezultaty**:
- Limit 2000 fiszek jest egzekwowany
- Komunikaty błędów są jasne i zrozumiałe
- Operacje batch są walidowane przed wykonaniem

### 4.5 Scenariusz: Bezpieczeństwo - Próba Dostępu do Cudzych Danych

**Kroki**:
1. Użytkownik A loguje się i tworzy fiszkę (ID: abc-123)
2. Użytkownik A wylogowuje się
3. Użytkownik B loguje się
4. Użytkownik B próbuje pobrać fiszkę abc-123 przez API
5. System zwraca 404 (nie znaleziono)
6. Użytkownik B próbuje zaktualizować fiszkę abc-123
7. System zwraca 404
8. Użytkownik B próbuje usunąć fiszkę abc-123
9. System zwraca 404

**Oczekiwane rezultaty**:
- RLS policies działają poprawnie
- Użytkownik nie może zobaczyć ani modyfikować cudzych danych
- Komunikaty błędów nie ujawniają informacji o istnieniu cudzych danych

## 5. Środowisko Testowe

### 5.1 Środowiska Testowe

#### 5.1.1 Środowisko Lokalne (Development)
- **Baza danych**: Supabase lokalny (Docker)
- **Frontend**: Astro dev server (localhost:3000)
- **Backend**: Astro API routes
- **Użycie**: Testy jednostkowe, integracyjne, E2E podczas rozwoju

#### 5.1.2 Środowisko Testowe (Staging)
- **Baza danych**: Supabase testowy (osobny projekt)
- **Frontend**: Zbudowana aplikacja na serwerze testowym
- **Backend**: Astro API routes
- **Użycie**: Testy E2E, testy wydajnościowe, testy bezpieczeństwa

#### 5.1.3 Środowisko Produkcyjne (Production)
- **Baza danych**: Supabase produkcyjny
- **Frontend**: Zbudowana aplikacja na DigitalOcean
- **Backend**: Astro API routes
- **Użycie**: Tylko testy smoke (podstawowa weryfikacja po wdrożeniu)

### 5.2 Dane Testowe

#### 5.2.1 Użytkownicy Testowi
- **Użytkownik podstawowy**: `test_user@example.com` / `TestPassword123!`
- **Użytkownik z limitem**: `limit_user@example.com` (1999 fiszek)
- **Użytkownik z pustą listą**: `empty_user@example.com`

#### 5.2.2 Fiszki Testowe
- Zestaw 100 fiszek z różnymi tematami
- Fiszki z różnymi datami powtórek
- Fiszki z różnymi źródłami (manual, ai-full, ai-edited)

### 5.3 Konfiguracja Środowiska

#### 5.3.1 Zmienne Środowiskowe
```env
# Test Environment
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=test_anon_key
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test_user@example.com
TEST_USER_PASSWORD=TestPassword123!
```

#### 5.3.2 Baza Danych Testowa
- Osobna baza danych dla testów
- Automatyczne czyszczenie po testach
- Seed danych testowych przed testami

## 6. Narzędzia do Testowania

### 6.1 Testy Jednostkowe i Integracyjne

#### 6.1.1 Vitest
- **Użycie**: Testy jednostkowe komponentów, serwisów, funkcji
- **Konfiguracja**: `vitest.config.ts`
- **Pluginy**: 
  - `@testing-library/react` - testowanie komponentów React
  - `@testing-library/jest-dom` - dodatkowe matchery DOM
  - `@testing-library/user-event` - symulacja interakcji użytkownika

#### 6.1.2 React Testing Library
- **Użycie**: Testy komponentów React
- **Zalety**: Testowanie z perspektywy użytkownika, dostępność

### 6.2 Testy End-to-End

#### 6.2.1 Playwright
- **Użycie**: Testy E2E pełnych przepływów użytkownika
- **Konfiguracja**: `playwright.config.ts`
- **Funkcje**:
  - Automatyczne uruchamianie serwera deweloperskiego
  - Screenshots i videos przy błędach
  - Trace viewer dla debugowania
  - Page Object Model (już zaimplementowany)

### 6.3 Testy Wydajnościowe

#### 6.3.1 k6
- **Użycie**: Testy obciążeniowe API
- **Scenariusze**: Różne obciążenia, współbieżne żądania

#### 6.3.2 Lighthouse
- **Użycie**: Testy wydajności frontendu
- **Metryki**: FCP, TTI, LCP, CLS

### 6.4 Testy Bezpieczeństwa

#### 6.4.1 OWASP ZAP
- **Użycie**: Automatyczne skanowanie podatności
- **Zakres**: XSS, SQL Injection, CSRF

#### 6.4.2 axe-core
- **Użycie**: Testy dostępności
- **Integracja**: W Playwright i Vitest

### 6.5 Narzędzia Pomocnicze

#### 6.5.1 MSW (Mock Service Worker)
- **Użycie**: Mockowanie API w testach jednostkowych
- **Zalety**: Testy bez zależności od zewnętrznych serwisów

#### 6.5.2 Supertest
- **Użycie**: Testy API endpoints (alternatywa dla bezpośrednich wywołań)

## 7. Harmonogram Testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)
- [ ] Konfiguracja środowiska testowego
- [ ] Setup narzędzi testowych (Vitest, Playwright)
- [ ] Przygotowanie danych testowych
- [ ] Utworzenie Page Object Models dla E2E
- [ ] Konfiguracja CI/CD dla testów

### 7.2 Faza 2: Testy Jednostkowe (Tydzień 2-3)
- [ ] Testy komponentów React (autentykacja)
- [ ] Testy komponentów React (fiszki)
- [ ] Testy komponentów React (generowanie)
- [ ] Testy serwisów (FlashcardService)
- [ ] Testy walidacji (schematy Zod)
- [ ] Testy hooks i stores (Zustand)

### 7.3 Faza 3: Testy Integracyjne (Tydzień 4-5)
- [ ] Testy API endpoints (GET, POST, PUT, PATCH, DELETE)
- [ ] Testy integracji z Supabase
- [ ] Testy middleware
- [ ] Testy batch operations
- [ ] Testy RLS policies

### 7.4 Faza 4: Testy E2E (Tydzień 6-7)
- [ ] Testy przepływów autentykacji
- [ ] Testy przepływów zarządzania fiszkami
- [ ] Testy przepływów generowania z AI
- [ ] Testy wyszukiwania i filtrowania
- [ ] Testy responsywności

### 7.5 Faza 5: Testy Bezpieczeństwa i Wydajności (Tydzień 8)
- [ ] Testy bezpieczeństwa (autoryzacja, walidacja)
- [ ] Testy wydajnościowe API
- [ ] Testy wydajnościowe frontendu
- [ ] Testy dostępności (a11y)
- [ ] Testy kompatybilności przeglądarek

### 7.6 Faza 6: Testy Regresyjne i Utrzymanie (Ciągłe)
- [ ] Testy regresyjne przed każdym release
- [ ] Aktualizacja testów przy zmianach w kodzie
- [ ] Monitoring pokrycia testami
- [ ] Refaktoryzacja testów

## 8. Kryteria Akceptacji Testów

### 8.1 Pokrycie Kodem
- **Minimum**: 80% pokrycia kodu testami jednostkowymi
- **Docelowe**: 90% pokrycia kodu
- **Krytyczne obszary**: 100% pokrycia (autentykacja, bezpieczeństwo, walidacja)

### 8.2 Wskaźniki Jakości
- **Wszystkie testy muszą przechodzić** przed merge do głównej gałęzi
- **Brak testów flaky** (niestabilnych testów)
- **Czas wykonania testów**: < 10 minut dla pełnej suity

### 8.3 Kryteria Akceptacji Funkcjonalności

#### 8.3.1 Autentykacja
- ✅ Użytkownik może się zarejestrować
- ✅ Użytkownik może się zalogować
- ✅ Użytkownik może się wylogować
- ✅ Użytkownik może zresetować hasło
- ✅ Chronione trasy wymagają autentykacji
- ✅ Nieautoryzowany dostęp jest blokowany

#### 8.3.2 Zarządzanie Fiszkami
- ✅ Użytkownik może tworzyć fiszki
- ✅ Użytkownik może edytować fiszki
- ✅ Użytkownik może usuwać fiszki
- ✅ Użytkownik może przeglądać listę fiszek
- ✅ Użytkownik może wyszukiwać fiszki
- ✅ Użytkownik może filtrować fiszki
- ✅ Użytkownik może sortować fiszki
- ✅ Paginacja działa poprawnie
- ✅ Limit 2000 fiszek jest egzekwowany

#### 8.3.3 Generowanie z AI
- ✅ Użytkownik może generować propozycje fiszek
- ✅ Użytkownik może edytować propozycje
- ✅ Użytkownik może zapisywać wybrane propozycje
- ✅ Walidacja danych wejściowych działa

#### 8.3.4 Bezpieczeństwo
- ✅ Użytkownik nie może zobaczyć cudzych danych
- ✅ Użytkownik nie może modyfikować cudzych danych
- ✅ Walidacja danych wejściowych działa
- ✅ RLS policies działają poprawnie

### 8.4 Metryki Wydajności
- **API Response Time**: < 200ms dla większości endpointów
- **API Response Time (batch)**: < 500ms dla batch 50 fiszek
- **Page Load Time**: < 2s dla First Contentful Paint
- **Time to Interactive**: < 3s

### 8.5 Dostępność
- **Lighthouse Accessibility Score**: ≥ 90
- **Kontrast kolorów**: WCAG AA minimum
- **Nawigacja klawiaturą**: Wszystkie funkcje dostępne

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 Zespół Deweloperski
- **Odpowiedzialność**: 
  - Pisanie testów jednostkowych wraz z kodem
  - Utrzymanie testów przy zmianach w kodzie
  - Naprawa testów, które się zepsuły
- **Narzędzia**: Vitest, React Testing Library

### 9.2 Zespół QA
- **Odpowiedzialność**:
  - Tworzenie i utrzymanie testów E2E
  - Testy integracyjne
  - Testy bezpieczeństwa
  - Testy wydajnościowe
  - Raportowanie błędów
- **Narzędzia**: Playwright, k6, OWASP ZAP

### 9.3 Product Owner
- **Odpowiedzialność**:
  - Definiowanie kryteriów akceptacji
  - Weryfikacja, że funkcjonalności spełniają wymagania
  - Priorytetyzacja napraw błędów

### 9.4 DevOps
- **Odpowiedzialność**:
  - Konfiguracja CI/CD dla testów
  - Utrzymanie środowisk testowych
  - Monitoring wydajności testów

## 10. Procedury Raportowania Błędów

### 10.1 Format Raportu Błędu

Każdy raport błędu powinien zawierać:

1. **Tytuł**: Krótki, opisowy tytuł błędu
2. **Priorytet**: 
   - **Krytyczny**: Blokuje główne funkcjonalności
   - **Wysoki**: Wpływa na ważne funkcjonalności
   - **Średni**: Wpływa na mniej ważne funkcjonalności
   - **Niski**: Drobne problemy, poprawki kosmetyczne
3. **Kroki do odtworzenia**: Szczegółowe kroki prowadzące do błędu
4. **Oczekiwane zachowanie**: Co powinno się wydarzyć
5. **Rzeczywiste zachowanie**: Co się faktycznie wydarzyło
6. **Środowisko**: 
   - Przeglądarka i wersja
   - System operacyjny
   - Środowisko (dev/staging/prod)
7. **Zrzuty ekranu**: Jeśli dotyczy
8. **Logi**: Błędy z konsoli, network logs
9. **Dodatkowe informacje**: Wszelkie inne istotne informacje

### 10.2 Przykład Raportu Błędu

```markdown
**Tytuł**: Nie można zapisać fiszki z pustym polem "Front"

**Priorytet**: Wysoki

**Kroki do odtworzenia**:
1. Zaloguj się do systemu
2. Przejdź do formularza tworzenia fiszki
3. Wypełnij tylko pole "Back"
4. Zostaw pole "Front" puste
5. Kliknij "Zapisz"

**Oczekiwane zachowanie**:
System powinien wyświetlić komunikat błędu walidacji i nie zapisać fiszki.

**Rzeczywiste zachowanie**:
System zapisuje fiszkę z pustym polem "Front", co powoduje błąd w bazie danych.

**Środowisko**:
- Przeglądarka: Chrome 120.0
- OS: Windows 11
- Środowisko: Development

**Zrzuty ekranu**:
[Załącz zrzut ekranu]

**Logi**:
```
Error: Validation failed: front is required
```

**Dodatkowe informacje**:
Błąd występuje również w formularzu edycji.
```

### 10.3 Narzędzie do Śledzenia Błędów

- **GitHub Issues**: Dla śledzenia błędów i zadań
- **Etykiety**: `bug`, `critical`, `high`, `medium`, `low`
- **Milestones**: Dla grupowania błędów według wersji

### 10.4 Proces Naprawy Błędów

1. **Raportowanie**: QA lub użytkownik zgłasza błąd
2. **Weryfikacja**: Deweloper weryfikuje błąd
3. **Priorytetyzacja**: Product Owner ustala priorytet
4. **Naprawa**: Deweloper naprawia błąd
5. **Testowanie**: QA weryfikuje naprawę
6. **Zamknięcie**: Błąd jest zamknięty po weryfikacji

## 11. Metryki i Monitoring

### 11.1 Metryki Testów

- **Pokrycie kodem**: % kodu pokrytego testami
- **Liczba testów**: Całkowita liczba testów
- **Czas wykonania**: Średni czas wykonania wszystkich testów
- **Wskaźnik powodzenia**: % testów przechodzących
- **Flaky tests**: Liczba niestabilnych testów

### 11.2 Monitoring w CI/CD

- **Automatyczne uruchamianie testów** przy każdym PR
- **Blokowanie merge** jeśli testy nie przechodzą
- **Raporty testów** w GitHub Actions
- **Code coverage reports** w PR

### 11.3 Dashboard Metryk

- **Pokrycie kodem** w czasie
- **Trendy wskaźnika powodzenia**
- **Czas wykonania testów** w czasie
- **Najczęstsze błędy**

## 12. Dokumentacja Testów

### 12.1 Dokumentacja Techniczna

- **Struktura testów**: Jak są zorganizowane testy
- **Konwencje nazewnictwa**: Jak nazywać testy
- **Best practices**: Najlepsze praktyki pisania testów
- **Przykłady**: Przykładowe testy dla różnych scenariuszy

### 12.2 Dokumentacja Użytkownika

- **Jak uruchomić testy**: Instrukcje dla deweloperów
- **Jak dodać nowy test**: Przewodnik dla nowych członków zespołu
- **Troubleshooting**: Rozwiązywanie problemów z testami

## 13. Podsumowanie

Niniejszy plan testów stanowi kompleksowy przewodnik po testowaniu aplikacji do zarządzania fiszkami. Plan jest żywym dokumentem, który powinien być aktualizowany wraz z rozwojem aplikacji i zmianami w wymaganiach.

Kluczowe elementy planu:
- **Kompleksowe pokrycie**: Wszystkie moduły i funkcjonalności są objęte testami
- **Różnorodne typy testów**: Od jednostkowych po E2E i wydajnościowe
- **Narzędzia**: Nowoczesne narzędzia dostosowane do stosu technologicznego
- **Procesy**: Jasne procedury i odpowiedzialności
- **Metryki**: Mierzalne kryteria jakości

Plan powinien być regularnie przeglądany i aktualizowany, aby zapewnić, że testy pozostają aktualne i skuteczne.

