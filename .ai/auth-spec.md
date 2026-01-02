# Specyfikacja architektury modułu autentykacji

## 1. Przegląd

Niniejsza specyfikacja opisuje architekturę modułu rejestracji, logowania, wylogowania i odzyskiwania hasła użytkowników zgodnie z wymaganiami US-003 (Kolekcje reguł) i US-004 (Bezpieczny dostęp i uwierzytelnianie) z dokumentu PRD.

### 1.1 Zakres funkcjonalny

Moduł autentykacji obejmuje:
- Rejestrację konta użytkownika (email + hasło)
- Logowanie do systemu
- Wylogowanie z systemu
- Reset hasła (zapomniałem hasła)
- Ustawienie nowego hasła po resetowaniu
- Zmianę hasła w ustawieniach konta
- Usunięcie konta (wymagane w PRD, ale poza bezpośrednim zakresem modułu auth)
- Ochronę funkcji wymagających autentykacji (Kolekcje reguł)
- Umożliwienie korzystania z funkcji podstawowych bez logowania (reguły ad-hoc)

### 1.2 Założenia techniczne

- **Frontend**: Astro 5 (strony SSR), React 19 (komponenty interaktywne), TypeScript 5
- **Backend**: Supabase Auth (autentykacja), Supabase PostgreSQL (dane użytkowników)
- **State Management**: Zustand (client-side state)
- **Walidacja**: Zod (schematy walidacji), React Hook Form (formularze)
- **UI Components**: Shadcn/ui (komponenty React)

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron Astro

#### 2.1.1 Strony autentykacji (już istniejące, wymagają rozszerzenia)

**`src/pages/auth/login.astro`**
- **Status**: Istnieje, wymaga uzupełnienia komponentu `LoginForm`
- **Funkcjonalność**:
  - Renderuje formularz logowania (React component)
  - Obsługuje przekierowania po zalogowaniu
  - Wyświetla link "Zapomniałem hasła" → `/auth/forgot`
  - Link do rejestracji → `/auth/register`
- **Wymagania**:
  - `export const prerender = false` (SSR wymagany dla Supabase)
  - Integracja z `useAuthStore` przez komponent React
  - Obsługa błędów autentykacji

**`src/pages/auth/register.astro`**
- **Status**: Istnieje, komponent `RegisterForm` zaimplementowany
- **Funkcjonalność**:
  - Formularz rejestracji z polami: email, password, confirm password
  - Walidacja: email format, hasło min. 8 znaków, potwierdzenie hasła
  - Po rejestracji: automatyczne logowanie lub komunikat o konieczności potwierdzenia email
  - Link do logowania → `/auth/login`
- **Wymagania**:
  - Walidacja po stronie klienta (Zod + React Hook Form)
  - Obsługa błędów Supabase (istniejący email, słabe hasło, itp.)

**`src/pages/auth/forgot.astro`**
- **Status**: Istnieje, wymaga uzupełnienia komponentu `ForgotForm`
- **Funkcjonalność**:
  - Formularz z polem email
  - Wysłanie linku resetującego hasło przez Supabase
  - Komunikat sukcesu: "Link został wysłany na adres e-mail"
  - Link powrotu do logowania
- **Wymagania**:
  - Walidacja formatu email
  - Obsługa błędów (nieistniejący email - neutralna odpowiedź)

**`src/pages/auth/reset.astro`**
- **Status**: Istnieje, wymaga uzupełnienia komponentu `ResetForm`
- **Funkcjonalność**:
  - Formularz ustawienia nowego hasła (password, confirm password)
  - Pobranie tokenu z URL (hash fragment z Supabase)
  - Walidacja: hasło min. 8 znaków, potwierdzenie
  - Po ustawieniu: przekierowanie do logowania lub dashboardu
- **Wymagania**:
  - Obsługa tokenu resetującego z Supabase
  - Walidacja tokenu (wygaśnięcie, nieprawidłowy token)

#### 2.1.2 Główny layout aplikacji

**`src/layouts/Layout.astro`** (wymaga rozbudowy)
- **Status**: Istnieje w podstawowej formie, wymaga dodania nawigacji
- **Funkcjonalność**:
  - Główny layout dla wszystkich stron aplikacji
  - Nagłówek z nawigacją:
    - Logo/nazwa aplikacji (lewa strona)
    - Przycisk "Zaloguj się" (prawy górny róg) - widoczny gdy użytkownik NIE jest zalogowany
    - Przycisk "Wyloguj" (prawy górny róg) - widoczny gdy użytkownik JEST zalogowany
    - Menu użytkownika (opcjonalnie): Ustawienia, Profil
  - Slot dla treści strony
- **Wymagania**:
  - Sprawdzanie stanu autentykacji (server-side w Astro)
  - Renderowanie warunkowe przycisków logowania/wylogowania
  - Integracja z middleware do pobrania danych użytkownika

**`src/layouts/AuthLayout.astro`** (nowy, opcjonalny)
- **Funkcjonalność**:
  - Uproszczony layout dla stron autentykacji
  - Brak nawigacji głównej
  - Centrowany kontener z formularzem
  - Logo/nazwa aplikacji
- **Wymagania**:
  - Możliwość użycia zamiast `Layout.astro` dla stron `/auth/*`

#### 2.1.3 Strony chronione

**Strony wymagające autentykacji** (przykłady):
- `/collections` - Kolekcje reguł (US-003)
- `/settings` - Ustawienia konta
- `/dashboard` - Dashboard użytkownika (jeśli istnieje)

**Mechanizm ochrony**:
- Middleware sprawdza autentykację przed renderowaniem
- Przekierowanie na `/auth/login?redirect=/collections` jeśli brak autentykacji
- Po zalogowaniu przekierowanie na oryginalną ścieżkę

**Strony dostępne bez autentykacji**:
- `/` - Strona główna
- `/auth/*` - Wszystkie strony autentykacji
- `/flashcards/generate` - Generowanie fiszek (jeśli dostępne bez logowania)
- Funkcje "ad-hoc" (reguły bez zapisywania)

### 2.2 Komponenty React (Client-side)

#### 2.2.1 Formularze autentykacji

**`src/components/auth/LoginForm.tsx`** (wymaga utworzenia)
- **Funkcjonalność**:
  - Formularz logowania: email, password
  - Przycisk "Zaloguj się"
  - Link "Zapomniałem hasła" → `/auth/forgot`
  - Link "Nie masz konta? Zarejestruj się" → `/auth/register`
  - Obsługa stanu ładowania (disable podczas requestu)
  - Wyświetlanie błędów autentykacji
- **Integracja**:
  - `useAuthStore.login(email, password)`
  - React Hook Form + Zod validation
  - Shadcn/ui: `Form`, `Input`, `Button`, `Card`
- **Walidacja**:
  - Email: wymagany, format email
  - Password: wymagany
- **Obsługa błędów**:
  - "Nieprawidłowy e-mail lub hasło" (bez ujawniania, co jest niepoprawne)
  - "Email nie został potwierdzony"
  - Rate limiting: "Zbyt wiele prób. Spróbuj ponownie za chwilę."

**`src/components/auth/RegisterForm.tsx`** (istnieje, wymaga weryfikacji)
- **Status**: Zaimplementowany
- **Funkcjonalność**:
  - Formularz: email, password, confirm password
  - Walidacja: email format, hasło min. 8 znaków, potwierdzenie zgodności
  - Toggle widoczności hasła (ikony Eye/EyeOff)
  - Obsługa błędów rejestracji
- **Integracja**:
  - `useAuthStore.register(email, password)`
- **Wymagania**:
  - Po rejestracji: sprawdzenie `email_confirmed_at`
  - Jeśli brak potwierdzenia: komunikat "Sprawdź swoją skrzynkę e-mail"
  - Jeśli potwierdzone: automatyczne przekierowanie na dashboard

**`src/components/auth/ForgotForm.tsx`** (wymaga utworzenia)
- **Funkcjonalność**:
  - Formularz: email
  - Przycisk "Wyślij link resetujący"
  - Komunikat sukcesu: "Link został wysłany na adres e-mail"
  - Link powrotu do logowania
- **Integracja**:
  - `useAuthStore.resetPassword(email)`
- **Walidacja**:
  - Email: wymagany, format email
- **Obsługa błędów**:
  - Neutralna odpowiedź dla nieistniejącego emaila (bez ujawniania)
  - Rate limiting

**`src/components/auth/ResetForm.tsx`** (wymaga utworzenia)
- **Funkcjonalność**:
  - Formularz: password, confirm password
  - Pobranie tokenu z URL (hash fragment)
  - Przycisk "Ustaw nowe hasło"
  - Toggle widoczności hasła
- **Integracja**:
  - `useAuthStore.updatePassword(password)` (po weryfikacji tokenu)
  - Supabase `auth.getSession()` do weryfikacji tokenu z URL
- **Walidacja**:
  - Password: min. 8 znaków
  - Confirm: zgodność z password
- **Obsługa błędów**:
  - "Token wygasł lub jest nieprawidłowy"
  - "Hasło musi mieć co najmniej 8 znaków"

#### 2.2.2 Komponenty nawigacji

**`src/components/navigation/Header.astro`** (nowy)
- **Funkcjonalność**:
  - Nagłówek aplikacji z nawigacją
  - Logo/nazwa aplikacji (lewa strona)
  - Przycisk "Zaloguj się" (prawy górny róg) - gdy `!user`
  - Przycisk "Wyloguj" (prawy górny róg) - gdy `user`
  - Menu użytkownika (opcjonalnie): Ustawienia, Profil
- **Integracja**:
  - Server-side: `context.locals.user` z middleware
  - Client-side: `useAuthStore.user` dla interaktywnych elementów
- **Wymagania**:
  - Renderowanie warunkowe w zależności od stanu autentykacji
  - Linki do odpowiednich stron

**`src/components/navigation/AuthButton.tsx`** (nowy, opcjonalny)
- **Funkcjonalność**:
  - Przycisk logowania/wylogowania
  - Wyświetla "Zaloguj się" lub "Wyloguj" w zależności od stanu
  - Obsługa kliknięcia: przekierowanie lub wywołanie `logout()`
- **Integracja**:
  - `useAuthStore.user`, `useAuthStore.logout()`
- **Użycie**:
  - W `Header.astro` jako komponent React (client-side)

#### 2.2.3 Komponenty ochrony dostępu

**`src/components/auth/ProtectedRoute.tsx`** (nowy, opcjonalny)
- **Funkcjonalność**:
  - Wrapper dla komponentów wymagających autentykacji
  - Sprawdza `useAuthStore.user`
  - Jeśli brak użytkownika: przekierowanie na `/auth/login?redirect=...`
  - Wyświetla loader podczas sprawdzania autentykacji
- **Użycie**:
  - Ochrona komponentów React wymagających autentykacji
  - Alternatywa dla server-side middleware (dla dynamicznych komponentów)

**`src/components/auth/AuthGuard.astro`** (nowy)
- **Funkcjonalność**:
  - Server-side wrapper dla stron Astro wymagających autentykacji
  - Sprawdza `context.locals.user` z middleware
  - Jeśli brak użytkownika: przekierowanie na `/auth/login?redirect=...`
  - Renderuje slot tylko dla zalogowanych użytkowników
- **Użycie**:
  - W `src/pages/collections/index.astro` (Kolekcje reguł)
  - W `src/pages/settings/index.astro` (Ustawienia konta)

### 2.3 Walidacja i komunikaty błędów

#### 2.3.1 Schematy walidacji (Zod)

**`src/lib/validations/auth.schemas.ts`** (nowy)
- **Schematy**:
  - `loginSchema`: `{ email: string().email(), password: string().min(1) }`
  - `registerSchema`: `{ email: string().email(), password: string().min(8), confirm: string() }` + refine dla zgodności haseł
  - `forgotPasswordSchema`: `{ email: string().email() }`
  - `resetPasswordSchema`: `{ password: string().min(8), confirm: string() }` + refine
  - `changePasswordSchema`: `{ currentPassword: string(), newPassword: string().min(8), confirm: string() }` + refine

#### 2.3.2 Mapowanie błędów Supabase

**`src/lib/stores/auth.store.ts`** (istnieje, wymaga rozszerzenia)
- **Funkcja `mapAuthError`**:
  - Mapuje błędy Supabase na polskie komunikaty
  - Obsługiwane błędy:
    - "Invalid login credentials" → "Nieprawidłowy e-mail lub hasło."
    - "Email not confirmed" → "Potwierdź swój adres e-mail przed zalogowaniem."
    - "User already registered" → "Użytkownik z tym adresem e-mail już istnieje."
    - "Password should be at least 6 characters" → "Hasło musi mieć co najmniej 8 znaków."
    - "Email rate limit exceeded" → "Zbyt wiele prób. Spróbuj ponownie za chwilę."
    - "Token expired" → "Link wygasł. Poproś o nowy link resetujący hasło."
    - "Invalid token" → "Link jest nieprawidłowy. Poproś o nowy link resetujący hasło."
    - Domyślnie: oryginalny komunikat błędu lub "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."

### 2.4 Scenariusze użytkownika

#### 2.4.1 Rejestracja nowego użytkownika

1. Użytkownik wchodzi na `/auth/register`
2. Wypełnia formularz: email, hasło, potwierdzenie hasła
3. Walidacja po stronie klienta (Zod)
4. Po zatwierdzeniu: wywołanie `useAuthStore.register(email, password)`
5. Supabase tworzy konto i wysyła email potwierdzający (jeśli włączone)
6. Jeśli email wymaga potwierdzenia:
   - Wyświetlenie komunikatu: "Sprawdź swoją skrzynkę e-mail i potwierdź konto."
   - Użytkownik nie jest automatycznie logowany
7. Jeśli email nie wymaga potwierdzenia (lub jest już potwierdzony):
   - Automatyczne logowanie
   - Przekierowanie na `/` (dashboard)

#### 2.4.2 Logowanie

1. Użytkownik wchodzi na `/auth/login` (lub klika "Zaloguj się" w headerze)
2. Wypełnia formularz: email, hasło
3. Walidacja po stronie klienta
4. Po zatwierdzeniu: wywołanie `useAuthStore.login(email, password)`
5. Supabase weryfikuje dane i zwraca sesję (JWT)
6. Jeśli sukces:
   - Zapisanie sesji w `useAuthStore`
   - Przekierowanie na `/` (lub `redirect` query param jeśli istnieje)
7. Jeśli błąd:
   - Wyświetlenie komunikatu błędu (bez ujawniania szczegółów)
   - Formularz pozostaje wypełniony (opcjonalnie)

#### 2.4.3 Reset hasła

1. Użytkownik wchodzi na `/auth/forgot`
2. Wypełnia formularz: email
3. Po zatwierdzeniu: wywołanie `useAuthStore.resetPassword(email)`
4. Supabase wysyła email z linkiem resetującym
5. Wyświetlenie komunikatu: "Link do resetowania hasła został wysłany na Twój adres e-mail."
6. Użytkownik klika link w emailu → przekierowanie na `/auth/reset#access_token=...&type=recovery`
7. Strona `/auth/reset` pobiera token z hash fragment
8. Użytkownik wypełnia formularz: nowe hasło, potwierdzenie
9. Po zatwierdzeniu: wywołanie `useAuthStore.updatePassword(password)`
10. Supabase weryfikuje token i aktualizuje hasło
11. Przekierowanie na `/auth/login` (lub automatyczne logowanie)

#### 2.4.4 Wylogowanie

1. Użytkownik klika "Wyloguj" w headerze
2. Wywołanie `useAuthStore.logout()`
3. Supabase usuwa sesję (tokeny)
4. Wyczyszczenie stanu w `useAuthStore`
5. Przekierowanie na `/auth/login`

#### 2.4.5 Dostęp do chronionych funkcji (Kolekcje reguł)

1. Użytkownik próbuje wejść na `/collections` bez logowania
2. Middleware sprawdza `context.locals.user`
3. Jeśli brak użytkownika: przekierowanie na `/auth/login?redirect=/collections`
4. Po zalogowaniu: automatyczne przekierowanie na `/collections`
5. Jeśli użytkownik jest zalogowany: renderowanie strony `/collections`

---

## 3. LOGIKA BACKENDOWA

### 3.1 Middleware Astro

**`src/middleware/index.ts`** (istnieje, wymaga rozbudowy)

#### 3.1.1 Obecna implementacja

- Dodaje `supabaseClient` do `context.locals.supabase`
- Ustawia `context.locals.userId = DEFAULT_USER_ID` (development)
- Nie sprawdza autentykacji użytkownika

#### 3.1.2 Wymagane rozszerzenia

**Funkcjonalność**:
1. **Pobieranie sesji użytkownika**:
   - Odczytanie cookies z requestu (Supabase Auth używa cookies)
   - Weryfikacja sesji przez `supabase.auth.getUser()` lub `supabase.auth.getSession()`
   - Zapisanie `user` w `context.locals.user`

2. **Ochrona tras wymagających autentykacji**:
   - Lista chronionych ścieżek: `/collections`, `/settings`, `/dashboard` (konfigurowalna)
   - Sprawdzenie czy `context.locals.user` istnieje
   - Jeśli brak: przekierowanie na `/auth/login?redirect={originalPath}`

3. **Dodanie helperów do context.locals**:
   - `context.locals.user`: `User | null` - aktualny użytkownik
   - `context.locals.userId`: `string | null` - ID użytkownika (lub `DEFAULT_USER_ID` dla development)
   - `context.locals.isAuthenticated`: `boolean` - czy użytkownik jest zalogowany
   - `context.locals.requireAuth()`: funkcja pomocnicza do wymuszania autentykacji

**Implementacja**:
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Pobranie Supabase client
  const supabase = supabaseClient;
  context.locals.supabase = supabase;

  // Pobranie sesji użytkownika z cookies
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Zapisanie użytkownika w context
  context.locals.user = user;
  context.locals.userId = user?.id || DEFAULT_USER_ID;
  context.locals.isAuthenticated = !!user;

  // Lista chronionych ścieżek
  const protectedPaths = ['/collections', '/settings', '/dashboard'];
  const isProtectedPath = protectedPaths.some(path => 
    context.url.pathname.startsWith(path)
  );

  // Sprawdzenie autentykacji dla chronionych ścieżek
  if (isProtectedPath && !user) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(context.url.pathname)}`;
    return Response.redirect(new URL(redirectUrl, context.url.origin), 302);
  }

  // Helper do wymuszania autentykacji
  context.locals.requireAuth = () => {
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  };

  return next();
});
```

### 3.2 Endpointy API (jeśli wymagane)

**Uwaga**: Większość operacji autentykacji jest obsługiwana bezpośrednio przez Supabase Auth SDK (client-side). Endpointy API mogą być potrzebne tylko dla:

1. **Weryfikacji tokenu server-side** (opcjonalnie)
2. **Zarządzania sesjami** (opcjonalnie)
3. **Usuwania konta** (wymaga server-side operacji)

#### 3.2.1 Endpoint usuwania konta (przyszłość)

**`src/pages/api/auth/delete-account.ts`** (opcjonalny, dla US-008)
- **Metoda**: DELETE
- **Autentykacja**: Wymagana (JWT token)
- **Funkcjonalność**:
  - Usunięcie konta użytkownika z Supabase Auth
  - Usunięcie wszystkich powiązanych danych (fiszki, kolekcje, itp.)
  - Hard delete (trwałe usunięcie)
- **Walidacja**:
  - Sprawdzenie autentykacji (`context.locals.user`)
  - Potwierdzenie hasła (opcjonalnie, dla bezpieczeństwa)
- **Odpowiedź**:
  - 200 OK: Konto usunięte
  - 401 Unauthorized: Brak autentykacji
  - 400 Bad Request: Błędne dane

### 3.3 Walidacja danych wejściowych

#### 3.3.1 Client-side (Zod)

- Wszystkie formularze używają schematów Zod
- Walidacja przed wysłaniem requestu do Supabase
- Komunikaty błędów w języku polskim

#### 3.3.2 Server-side (Supabase)

- Supabase Auth automatycznie waliduje:
  - Format email
  - Siłę hasła (min. 6 znaków domyślnie, można zwiększyć do 8)
  - Unikalność email
- Błędy są zwracane przez Supabase SDK i mapowane na polskie komunikaty

### 3.4 Obsługa wyjątków

#### 3.4.1 Client-side

- Wszystkie metody w `useAuthStore` używają try-catch
- Błędy są mapowane przez `mapAuthError()`
- Stan błędu jest zapisywany w `useAuthStore.error`
- Komponenty wyświetlają błędy użytkownikowi

#### 3.4.2 Server-side (middleware)

- Błędy podczas pobierania sesji są ignorowane (traktowane jako brak autentykacji)
- Przekierowania na `/auth/login` dla chronionych ścieżek
- Logowanie błędów do konsoli (development) lub systemu logowania (production)

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Integracja z Supabase Auth

#### 4.1.1 Konfiguracja Supabase

**Plik konfiguracyjny**: `supabase/config.toml` (lub dashboard Supabase)

**Wymagane ustawienia**:
- **Email Auth**: Włączone
- **Email Confirmation**: Opcjonalne w MVP (można wyłączyć dla szybszego developmentu)
- **Password Reset**: Włączone
- **Site URL**: URL aplikacji (np. `http://localhost:3000` dla developmentu)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/reset` (development)
  - `https://yourdomain.com/auth/reset` (production)
- **Rate Limiting**: 
  - Logowanie: 5 prób/minutę na IP
  - Reset hasła: 3 próby/godzinę na email

#### 4.1.2 Klient Supabase

**`src/db/supabase.client.ts`** (istnieje)

**Client-side** (`supabase`):
- Używany w komponentach React
- Automatycznie zarządza sesjami (cookies/localStorage)
- Metody: `auth.signUp()`, `auth.signInWithPassword()`, `auth.signOut()`, `auth.resetPasswordForEmail()`, `auth.updateUser()`

**Server-side** (`supabaseClient`):
- Używany w middleware i endpointach API
- Wymaga ręcznego przekazania cookies z requestu
- Metody: `auth.getUser()`, `auth.getSession()`

**Rozszerzenie** (wymagane):
- Utworzenie helpera do pobierania sesji server-side z cookies:
```typescript
export async function getServerSession(request: Request): Promise<Session | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.headers.get('cookie')?.split(';')
          .find(c => c.trim().startsWith(`${name}=`))
          ?.split('=')[1];
      },
    },
  });
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
```

### 4.2 Zarządzanie sesjami

#### 4.2.1 Client-side (Zustand Store)

**`src/lib/stores/auth.store.ts`** (istnieje, wymaga weryfikacji)

**Stan**:
- `user: User | null` - aktualny użytkownik
- `loading: boolean` - czy trwa operacja autentykacji
- `error: string | null` - komunikat błędu

**Metody**:
- `login(email, password)` - logowanie
- `register(email, password)` - rejestracja
- `logout()` - wylogowanie
- `resetPassword(email)` - reset hasła
- `updatePassword(password)` - ustawienie nowego hasła
- `initialize()` - inicjalizacja stanu (sprawdzenie sesji przy starcie)
- `clearError()` - wyczyszczenie błędu

**Inicjalizacja**:
- Wywołanie `initialize()` w komponencie root (np. w `Layout.astro` lub `App.tsx`)
- Sprawdzenie czy użytkownik ma aktywną sesję
- Aktualizacja stanu `user`

#### 4.2.2 Server-side (Middleware)

- Pobieranie sesji z cookies w middleware
- Zapisanie `user` w `context.locals.user`
- Dostęp do `user` w wszystkich stronach Astro przez `Astro.locals.user`

### 4.3 Tokeny JWT

**Zarządzanie przez Supabase**:
- Supabase automatycznie generuje i zarządza tokenami JWT
- Tokeny są przechowywane w cookies (httpOnly dla bezpieczeństwa)
- Tokeny są automatycznie odświeżane przez Supabase SDK
- Wygasanie tokenów: domyślnie 1 godzina (można skonfigurować)

**Weryfikacja**:
- Client-side: automatyczna przez Supabase SDK
- Server-side: przez `supabase.auth.getUser()` w middleware

### 4.4 Bezpieczeństwo

#### 4.4.1 Ochrona przed atakami

**Rate Limiting**:
- Logowanie: 5 prób/minutę na IP (konfiguracja Supabase)
- Reset hasła: 3 próby/godzinę na email
- Rejestracja: 3 próby/godzinę na IP

**Brute Force Protection**:
- Supabase automatycznie blokuje podejrzane próby logowania
- Komunikaty błędów nie ujawniają, czy email istnieje (neutralna odpowiedź)

**XSS Protection**:
- Sanityzacja danych wejściowych (automatyczna przez React)
- Escape HTML w komunikatach błędów
- Używanie Shadcn/ui komponentów (automatyczna sanitizacja)

**CSRF Protection**:
- Supabase używa cookies z flagą `SameSite=Strict`
- Tokeny JWT w cookies (nie w localStorage dla wrażliwych operacji)

#### 4.4.2 Hasła

**Wymagania**:
- Minimum 8 znaków (walidacja po stronie klienta)
- Hashowanie przez Supabase (bcrypt/argon2)
- Hasła nigdy nie są logowane ani przechowywane w plain text

**Reset hasła**:
- Tokeny jednorazowe (single-use)
- Wygasanie tokenów: 1 godzina (konfigurowalne)
- Linki resetujące zawierają hash token w URL

---

## 5. INTEGRACJA Z ISTNIEJĄCYM KODEM

### 5.1 Kompatybilność z istniejącymi funkcjami

#### 5.1.1 Fiszki (Flashcards)

**Dostęp bez logowania** (zgodnie z PRD):
- Użytkownik może tworzyć fiszki "ad-hoc" bez logowania
- Fiszki nie są zapisywane w bazie (lub są zapisywane jako tymczasowe)
- Po zalogowaniu: możliwość zapisania fiszek do konta

**Dostęp z logowaniem**:
- Fiszki są przypisane do `user_id`
- RLS (Row Level Security) w Supabase zapewnia izolację danych
- API endpointy sprawdzają `context.locals.userId`

#### 5.1.2 Kolekcje reguł (US-003)

**Wymagana autentykacja**:
- Funkcjonalność kolekcji jest dostępna TYLKO dla zalogowanych użytkowników
- Middleware przekierowuje na `/auth/login` jeśli brak autentykacji
- Komponenty React sprawdzają `useAuthStore.user` przed renderowaniem

**Implementacja**:
- Strona `/collections` wymaga autentykacji (middleware)
- Komponenty kolekcji używają `context.locals.userId` do zapytań do API
- RLS w Supabase zapewnia dostęp tylko do własnych kolekcji

### 5.2 Aktualizacja istniejących komponentów

#### 5.2.1 Layout.astro

**Wymagane zmiany**:
1. Dodanie nagłówka z nawigacją
2. Integracja z `Header.astro` (lub bezpośrednia implementacja)
3. Renderowanie warunkowe przycisków logowania/wylogowania
4. Sprawdzenie `Astro.locals.user` (server-side)

**Przykład**:
```astro
---
import Header from "../components/navigation/Header.astro";

const user = Astro.locals.user;
---

<Layout>
  <Header user={user} />
  <slot />
</Layout>
```

#### 5.2.2 Middleware

**Wymagane zmiany**:
1. Pobieranie sesji użytkownika z cookies
2. Zapisanie `user` w `context.locals.user`
3. Ochrona chronionych ścieżek
4. Aktualizacja `context.locals.userId` (z `user.id` zamiast `DEFAULT_USER_ID`)

### 5.3 Nowe pliki i moduły

**Nowe pliki do utworzenia**:
1. `src/components/auth/LoginForm.tsx`
2. `src/components/auth/ForgotForm.tsx`
3. `src/components/auth/ResetForm.tsx`
4. `src/components/navigation/Header.astro`
5. `src/components/navigation/AuthButton.tsx` (opcjonalnie)
6. `src/components/auth/AuthGuard.astro`
7. `src/lib/validations/auth.schemas.ts`
8. `src/layouts/AuthLayout.astro` (opcjonalnie)

**Pliki do modyfikacji**:
1. `src/middleware/index.ts` - rozbudowa o autentykację
2. `src/layouts/Layout.astro` - dodanie nawigacji
3. `src/lib/stores/auth.store.ts` - weryfikacja i ewentualne poprawki
4. `src/db/supabase.client.ts` - helper do server-side sesji (opcjonalnie)

---

## 6. TESTY I WALIDACJA

### 6.1 Scenariusze testowe

#### 6.1.1 Rejestracja
- ✅ Rejestracja z poprawnymi danymi
- ✅ Rejestracja z istniejącym emailem (błąd)
- ✅ Rejestracja z nieprawidłowym formatem email (walidacja)
- ✅ Rejestracja z hasłem < 8 znaków (walidacja)
- ✅ Rejestracja z niezgodnymi hasłami (walidacja)

#### 6.1.2 Logowanie
- ✅ Logowanie z poprawnymi danymi
- ✅ Logowanie z nieprawidłowym hasłem (błąd)
- ✅ Logowanie z nieistniejącym emailem (błąd)
- ✅ Logowanie z niepotwierdzonym emailem (błąd)
- ✅ Rate limiting (zbyt wiele prób)

#### 6.1.3 Reset hasła
- ✅ Reset z istniejącym emailem (sukces)
- ✅ Reset z nieistniejącym emailem (neutralna odpowiedź)
- ✅ Ustawienie nowego hasła z poprawnym tokenem
- ✅ Ustawienie nowego hasła z wygasłym tokenem (błąd)
- ✅ Ustawienie nowego hasła z nieprawidłowym tokenem (błąd)

#### 6.1.4 Ochrona dostępu
- ✅ Dostęp do `/collections` bez logowania (przekierowanie)
- ✅ Dostęp do `/collections` z logowaniem (sukces)
- ✅ Przekierowanie po zalogowaniu na oryginalną ścieżkę

### 6.2 Testy jednostkowe

**Komponenty**:
- Testy formularzy (walidacja, submit)
- Testy mapowania błędów
- Testy stanu `useAuthStore`

**Middleware**:
- Testy pobierania sesji
- Testy ochrony ścieżek
- Testy przekierowań

### 6.3 Testy E2E

**Główny przepływ**:
1. Rejestracja → Logowanie → Dostęp do chronionej strony → Wylogowanie
2. Reset hasła → Ustawienie nowego hasła → Logowanie

---

## 7. DOKUMENTACJA I UTRZYMANIE

### 7.1 Dokumentacja dla developera

**Pliki dokumentacyjne**:
- `README.md` - instrukcje uruchomienia i konfiguracji
- `.ai/auth-spec.md` - niniejsza specyfikacja
- Komentarze w kodzie dla kluczowych funkcji

### 7.2 Konfiguracja środowisk

**Zmienne środowiskowe**:
- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_KEY` - Anon key Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (tylko server-side, opcjonalnie)

**Pliki konfiguracyjne**:
- `.env` - zmienne środowiskowe (development)
- `.env.production` - zmienne środowiskowe (production)
- `supabase/config.toml` - konfiguracja Supabase (lokalna)

### 7.3 Monitoring i logowanie

**Eventy do logowania**:
- `user_registered` - rejestracja nowego użytkownika
- `user_logged_in` - logowanie
- `user_logged_out` - wylogowanie
- `password_reset_requested` - żądanie resetu hasła
- `password_reset_completed` - ustawienie nowego hasła
- `authentication_failed` - nieudana próba logowania (z powodem)

**Poziomy logów**:
- `info`: operacje autentykacji (rejestracja, logowanie, wylogowanie)
- `warn`: nieudane próby logowania, rate limiting
- `error`: błędy serwera, wyjątki

---

## 8. PODSUMOWANIE I NASTĘPNE KROKI

### 8.1 Priorytety implementacji

**Faza 1 - Podstawowa autentykacja**:
1. Rozbudowa middleware o pobieranie sesji
2. Utworzenie `LoginForm.tsx`
3. Utworzenie `ForgotForm.tsx`
4. Utworzenie `ResetForm.tsx`
5. Rozbudowa `Layout.astro` o nawigację
6. Testy podstawowych przepływów

**Faza 2 - Ochrona dostępu**:
1. Implementacja ochrony ścieżek w middleware
2. Utworzenie `AuthGuard.astro`
3. Integracja z funkcją Kolekcji reguł
4. Testy ochrony dostępu

**Faza 3 - Ulepszenia**:
1. Ustawienia konta (zmiana hasła, usunięcie konta)
2. Menu użytkownika
3. Ulepszenia UX (loading states, animacje)
4. Testy E2E

### 8.2 Zależności

**Zewnętrzne biblioteki** (już zainstalowane):
- `@supabase/supabase-js` - klient Supabase
- `zustand` - state management
- `react-hook-form` - formularze
- `@hookform/resolvers` - resolvers dla RHF
- `zod` - walidacja

**Komponenty Shadcn/ui** (już zainstalowane):
- `button`, `input`, `form`, `label`, `card`

### 8.3 Uwagi końcowe

- Wszystkie operacje autentykacji są wykonywane przez Supabase Auth SDK
- Brak potrzeby tworzenia własnych endpointów API dla podstawowych operacji
- Middleware zapewnia server-side ochronę tras
- Client-side state management przez Zustand dla interaktywnych komponentów
- Kompatybilność z istniejącym kodem (fiszki, kolekcje) przez `context.locals.userId`

---

**Data utworzenia**: 2025-01-XX  
**Wersja**: 1.0  
**Autor**: AI Assistant

