# Architektura UI dla "Fiszki" – MVP

## 1. Przegląd struktury UI

Aplikacja wykorzystuje hybrydowe podejście Astro + React:

* **Astro 5** – deklaratywny routing (`/src/pages`), renderowanie stron statycznych/SSR, podstawa PWA.
* **React 19** – interaktywne widżety (formularze, listy, modale, sesja powtórek).
* **Tailwind 4** – responsywny układ (desktop-first dla tworzenia, mobile-first dla powtórek).
* **Shadcn/ui** – spójny zbiór komponentów bazowych (Button, Input, Modal, Toast, Skeleton …).
* **TypeScript 5** – typowanie end-to-end (komponenty + integracja z API).

Główne filary projektowe:

* **Responsywność kontekstowa** – desktop zoptymalizowany pod tworzenie/zarządzanie, mobile pod szybkie powtórki.
* **PWA & Offline**  – cache statycznych zasobów, fallbacky offline dla listy fiszek i sesji powtórek.
* **Bezpieczeństwo & UX** – pełna walidacja (Zod ↔ backend), toast-based feedback, globalny *Error Boundary*.
* **Zarządzanie stanem** – `Zustand` (singleton store) + `React Context` dla sesji auth, synchro kart przez `BroadcastChannel`.

## 2. Lista widoków

| # | Widok | Ścieżka | Główny cel | Kluczowe informacje | Kluczowe komponenty | UX / A11y / Sec |
|---|-------|---------|-----------|---------------------|--------------------|-----------------|
| 1 | Rejestracja | `/auth/register` | Założenie konta | Formularz e-mail + hasło, link do logowania | `AuthLayout`, `EmailInput`, `PasswordInput`, `SubmitButton`, `FormError` | Walidacja live, komunikaty ARIA, minimalne reguły hasła |
| 2 | Logowanie | `/auth/login` | Dostęp do aplikacji | Formularz e-mail + hasło, link „Zapomniałem hasła”, rejestracja | j.w. | Brak ujawniania czy e-mail istnieje, pamiętaj mnie |
| 3 | Reset hasła – żądanie | `/auth/forgot` | Wysłanie linku reset | Pole e-mail | `EmailInput`, `SubmitButton`, `InfoAlert` | Brak ujawniania istnienia konta |
| 4 | Reset hasła – zmiana | `/auth/reset` | Ustawienie nowego hasła | Formularz nowe hasło + potwierdzenie | `PasswordInput×2`, `SubmitButton` | Token z URL, walidacja silnego hasła |
| 5 | Dashboard | `/dashboard` | Szybki przegląd stanu | Kafelek „Fiszki” (liczba), „Do powtórki dziś”, przycisk „Dodaj fiszkę”, skróty FAQ | `Navbar`, `StatCard`, `QuickActions`, `ToastContainer` | Skeleton przy ładowaniu, licznik powtórek aktualizowany w czasie rzeczywistym |
| 6 | Lista fiszek | `/flashcards` | Przegląd i zarządzanie | Tabela 50×, search, paginacja, akcje edytuj/usuń | `Table`, `SearchBar`, `Pagination`, `FlashcardRow`, `DeleteDialog` | Sortowalne kolumny, klawiatura (↑↓, Enter), skeleton rows |
| 7 | Nowa fiszka | `/flashcards/new` | Dodanie fiszki | Formularz front/back/subject | `FlashcardForm` | Draft w `localStorage`, Ctrl+Enter = zapisz & nowa, ARIA-labels |
| 8 | Edycja fiszki (modal) | `/flashcards/:id(edit?)` | Szybka edycja | Pre-filled formularz | `Modal`, `FlashcardForm` | Focus-trap, ESC zamyka, optimistic update |
| 9 | Sesja powtórek – start | `/reviews/today` | Lista do powtórki dziś | Podsumowanie: X kart, przycisk „Rozpocznij” | `ReviewIntro`, `StartButton` | Wyłączenie przy braku kart, informacja offline |
|10 | Sesja powtórek – karta | `/reviews/session/:sid` (fullscreen) | Prezentacja kart | Widok front → reveal → wybór trudności, licznik X/Y | `ReviewCard`, `RevealButton`, `DifficultyButtons`, `ProgressBar` | Duże hit-targets (mobile), gestures (swipe), ARIA-live |
|11 | Ustawienia konta | `/settings` | Zmiana hasła, usunięcie konta | Sekcje: dane dostępu (read-only), zmiana hasła, usuń konto | `SettingsForm`, `DeleteAccountDialog` | Ponowne podanie hasła przy usuwaniu, WCAG fokus |
|12 | FAQ / Pomoc | `/help` | Odp. na pytania & feedback | Lista FAQ, link mailto lub formularz feedback | `Accordion`, `FeedbackLink` | Dostępność nagłówków, semantyka |
|13 | 404 / Błędy | `/*` | Informacja o błędzie | Kod błędu, link do dashboardu | `ErrorLayout` | Brak przecieków serwerowych, ARIA role alert |

## 3. Mapa podróży użytkownika

### Główny przepływ „Nowy użytkownik”
```
/register → /login → /dashboard → /flashcards/new → (wiele zapisów) → /reviews/today → /reviews/session/:id → /dashboard
```
1. Użytkownik zakłada konto i loguje się.
2. Na dashboardzie widzi pusty stan i przycisk „Dodaj fiszkę”.
3. Wypełnia formularz, zapisuje pierwszą fiszkę (draft persisted).
4. Po przekroczeniu progu `nextReviewAt ≤ today` dashboard pokazuje licznik powtórek.
5. Użytkownik przechodzi do listy powtórek, rozpoczyna sesję.
6. Po zakończeniu sesji wraca na dashboard – licznik = 0.

### Przepływ „Zarządzanie fiszkami”
```
/dashboard → /flashcards → (search / paginacja) → Edytuj ⇢ modal → Zapisz
                                              ↳ Usuń ⇢ dialog → Potwierdź
```

### Przepływ „Ustawienia konta”
```
/dashboard → /settings → (zmiana hasła) | (usuń konto)
```

## 4. Układ i struktura nawigacji

* **Navbar (góra, sticky)** – logo, link `Flashcards`, `Reviews Today (badge)`, `Help`, avatar z dropdownem (`Settings`, `Logout`).
* **Route-based rendering (Astro)** – każda ścieżka w `/src/pages` automatycznie mapuje na widok.
* **Breadcrumbs** – tylko na liście fiszek i ustawieniach.
* **Fullscreen overlay** – sesja powtórek zasłania navbar dla pełnego skupienia.
* **Deep Linking** – bezpośrednie URL-e do edycji (`/flashcards/:id/edit`) otwierają modal po mountcie.

## 5. Kluczowe komponenty wielokrotnego użycia

| Komponent | Opis | Źródło |
|-----------|------|--------|
| `AuthLayout` | Wspólny układ dla ekranów auth (centered card). | React |
| `Navbar` | Główna nawigacja, badge powtórek, dropdown user. | Astro + React |
| `StatCard` | Kafelek numeryczny z ikoną (dashboard). | Shadcn/ui `Card` |
| `FlashcardForm` | Reużywalny formularz (create/edit), obsługa draftu LS. | React Hook Form + Zod |
| `Table`, `Pagination`, `SearchBar` | Zestaw tabelaryczny z skeletonami. | React + Tailwind |
| `Modal`, `DeleteDialog` | Focus trap, ARIA zgodne, animowane. | Shadcn/ui |
| `ToastContainer` | Globalne powiadomienia (success / error). | `sonner` |
| `ReviewCard` | Widok front/back + animacja flip, gesty swipe. | React |
| `DifficultyButtons` | Trzy duże przyciski (hard/medium/easy). | Shadcn `Button` |
| `ProgressBar` | Pasek postępu sesji. | Tailwind |
| `ErrorBoundary` | Globalny catcher, fallback UI. | React |
| `Skeleton` | Placeholdery ładowania. | Shadcn/ui |

---

**Zgodność z API** – każdy widok wykorzystuje planowane endpointy (`/api/flashcards…`, `/api/review-sessions…`, Supabase Auth). Walidacje klienta wiernie odzwierciedlają zasady z API (długości pól, limity batch, ≤ 2000 kart). Kontrola limitów i konfliktów (`409`, `429`) obsługiwana toastami i stanami błędów.

**Mapowanie historyjek** – wszystkie user stories US-001 → US-019 zostały odzwierciedlone w powyższych widokach i komponentach (np. US-012–US-015 → sekcja powtórek; US-016–US-017 → drafty LS, globalna obsługa offline).

