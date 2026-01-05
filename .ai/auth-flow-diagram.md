# Diagram przepływu autentykacji

Diagram przedstawia architekturę i przepływy w systemie autentykacji zgodnie z PRD i specyfikacją autentykacji.

```mermaid
flowchart TB
    %% Strony Astro
    subgraph Pages["📄 Strony Astro (SSR)"]
        LoginPage["/auth/login.astro<br/>Strona logowania"]
        RegisterPage["/auth/register.astro<br/>Strona rejestracji"]
        ForgotPage["/auth/forgot.astro<br/>Reset hasła"]
        ResetPage["/auth/reset.astro<br/>Ustawienie hasła"]
        DashboardPage["/ (Dashboard)<br/>Lista fiszek"]
        CollectionsPage["/collections<br/>Kolekcje reguł"]
        SettingsPage["/settings<br/>Ustawienia konta"]
    end

    %% Komponenty React
    subgraph Components["⚛️ Komponenty React (Client-side)"]
        LoginForm["LoginForm.tsx<br/>Formularz logowania"]
        RegisterForm["RegisterForm.tsx<br/>Formularz rejestracji"]
        ForgotForm["ForgotForm.tsx<br/>Formularz resetu"]
        ResetForm["ResetForm.tsx<br/>Formularz ustawienia hasła"]
        ChangePasswordForm["ChangePasswordForm.tsx<br/>Zmiana hasła"]
        Header["Header.astro<br/>Nawigacja"]
    end

    %% Store (Zustand)
    subgraph Store["🗄️ Auth Store (Zustand)"]
        AuthStore["useAuthStore<br/>- user: User | null<br/>- loading: boolean<br/>- error: string | null<br/><br/>Metody:<br/>- login()<br/>- register()<br/>- logout()<br/>- resetPassword()<br/>- updatePassword()<br/>- initialize()"]
    end

    %% Middleware
    subgraph Middleware["🛡️ Middleware (Server-side)"]
        AuthMiddleware["middleware/index.ts<br/>- Pobiera sesję z cookies<br/>- Sprawdza context.locals.user<br/>- Chroni ścieżki (/collections, /settings)<br/>- Przekierowuje na /auth/login"]
    end

    %% Supabase
    subgraph Supabase["☁️ Supabase Auth"]
        SupabaseClient["supabase.client.ts<br/>Client-side & Server-side"]
        SupabaseAuth["Supabase Auth API<br/>- signUp()<br/>- signInWithPassword()<br/>- signOut()<br/>- resetPasswordForEmail()<br/>- updateUser()<br/>- getUser()"]
        SupabaseDB["PostgreSQL Database<br/>- auth.users<br/>- Row Level Security"]
    end

    %% Walidacja
    subgraph Validation["✅ Walidacja"]
        ZodSchemas["auth.schemas.ts<br/>- loginSchema<br/>- registerSchema<br/>- forgotPasswordSchema<br/>- resetPasswordSchema<br/>- changePasswordSchema"]
        ReactHookForm["React Hook Form<br/>+ Zod Resolver"]
    end

    %% Przepływy użytkownika
    subgraph UserFlows["👤 Przepływy użytkownika"]
        Flow1["1. Rejestracja"]
        Flow2["2. Logowanie"]
        Flow3["3. Reset hasła"]
        Flow4["4. Wylogowanie"]
        Flow5["5. Ochrona dostępu"]
    end

    %% Połączenia - Strony do komponentów
    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
    ForgotPage --> ForgotForm
    ResetPage --> ResetForm
    SettingsPage --> ChangePasswordForm
    DashboardPage --> Header
    CollectionsPage --> Header

    %% Komponenty do Store
    LoginForm --> AuthStore
    RegisterForm --> AuthStore
    ForgotForm --> AuthStore
    ResetForm --> AuthStore
    ChangePasswordForm --> AuthStore
    Header --> AuthStore

    %% Store do Supabase
    AuthStore --> SupabaseClient
    SupabaseClient --> SupabaseAuth
    SupabaseAuth --> SupabaseDB

    %% Walidacja
    LoginForm --> ReactHookForm
    RegisterForm --> ReactHookForm
    ForgotForm --> ReactHookForm
    ResetForm --> ReactHookForm
    ReactHookForm --> ZodSchemas

    %% Middleware
    LoginPage -.->|"Sprawdza autentykację"| AuthMiddleware
    RegisterPage -.->|"Sprawdza autentykację"| AuthMiddleware
    DashboardPage -.->|"Sprawdza autentykację"| AuthMiddleware
    CollectionsPage -.->|"Wymaga autentykacji"| AuthMiddleware
    SettingsPage -.->|"Wymaga autentykacji"| AuthMiddleware
    AuthMiddleware --> SupabaseClient

    %% Przepływy użytkownika
    Flow1 --> RegisterForm
    Flow2 --> LoginForm
    Flow3 --> ForgotForm
    Flow4 --> Header
    Flow5 --> AuthMiddleware

    %% Styling
    classDef pageStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef componentStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef storeStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef middlewareStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef supabaseStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef validationStyle fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef flowStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px

    class LoginPage,RegisterPage,ForgotPage,ResetPage,DashboardPage,CollectionsPage,SettingsPage pageStyle
    class LoginForm,RegisterForm,ForgotForm,ResetForm,ChangePasswordForm,Header componentStyle
    class AuthStore storeStyle
    class AuthMiddleware middlewareStyle
    class SupabaseClient,SupabaseAuth,SupabaseDB supabaseStyle
    class ZodSchemas,ReactHookForm validationStyle
    class Flow1,Flow2,Flow3,Flow4,Flow5 flowStyle
```

## Opis komponentów

### Strony Astro (SSR)

- **`/auth/login.astro`** - Strona logowania, renderuje `LoginForm`
- **`/auth/register.astro`** - Strona rejestracji, renderuje `RegisterForm`
- **`/auth/forgot.astro`** - Strona resetu hasła, renderuje `ForgotForm`
- **`/auth/reset.astro`** - Strona ustawienia nowego hasła, renderuje `ResetForm`
- **`/`** - Dashboard z listą fiszek (dostępny bez logowania dla fiszek ad-hoc)
- **`/collections`** - Kolekcje reguł (wymaga autentykacji)
- **`/settings`** - Ustawienia konta (wymaga autentykacji)

### Komponenty React (Client-side)

- **`LoginForm.tsx`** - Formularz logowania z walidacją (email, password)
- **`RegisterForm.tsx`** - Formularz rejestracji z walidacją (email, password, confirm)
- **`ForgotForm.tsx`** - Formularz resetu hasła (email)
- **`ResetForm.tsx`** - Formularz ustawienia nowego hasła (password, confirm)
- **`ChangePasswordForm.tsx`** - Formularz zmiany hasła w ustawieniach (current, new, confirm)
- **`Header.astro`** - Nagłówek z przyciskami logowania/wylogowania

### Auth Store (Zustand)

- **`useAuthStore`** - Globalny store zarządzający stanem autentykacji
  - Stan: `user`, `loading`, `error`
  - Metody: `login()`, `register()`, `logout()`, `resetPassword()`, `updatePassword()`, `initialize()`
  - Mapowanie błędów Supabase na polskie komunikaty

### Middleware (Server-side)

- **`middleware/index.ts`** - Middleware Astro
  - Pobiera sesję użytkownika z cookies
  - Sprawdza `context.locals.user`
  - Chroni ścieżki wymagające autentykacji (`/collections`, `/settings`)
  - Przekierowuje na `/auth/login?redirect=...` jeśli brak autentykacji

### Supabase

- **`supabase.client.ts`** - Klient Supabase (client-side i server-side)
- **Supabase Auth API** - Operacje autentykacji
- **PostgreSQL Database** - Baza danych z RLS (Row Level Security)

### Walidacja

- **`auth.schemas.ts`** - Schematy Zod dla wszystkich formularzy
- **React Hook Form** - Zarządzanie formularzami z integracją Zod

## Przepływy użytkownika

### 1. Rejestracja (US-001)

```
Użytkownik → /auth/register → RegisterForm → useAuthStore.register()
→ Supabase Auth.signUp() → Email confirmation (opcjonalnie)
→ Auto-login lub komunikat → Redirect do /
```

### 2. Logowanie (US-002)

```
Użytkownik → /auth/login → LoginForm → useAuthStore.login()
→ Supabase Auth.signInWithPassword() → JWT token w cookies
→ useAuthStore.user = user → Redirect do / lub redirect param
```

### 3. Reset hasła (US-006)

```
Użytkownik → /auth/forgot → ForgotForm → useAuthStore.resetPassword()
→ Supabase Auth.resetPasswordForEmail() → Email z linkiem
→ /auth/reset#token → ResetForm → useAuthStore.updatePassword()
→ Supabase Auth.updateUser() → Redirect do /auth/login
```

### 4. Wylogowanie (US-005)

```
Użytkownik → Header → useAuthStore.logout()
→ Supabase Auth.signOut() → Clear cookies → useAuthStore.user = null
→ Redirect do /auth/login
```

### 5. Ochrona dostępu (US-003, US-004)

```
Użytkownik → /collections (bez logowania) → Middleware sprawdza user
→ Brak user → Redirect do /auth/login?redirect=/collections
→ Po zalogowaniu → Redirect do /collections
```

## Bezpieczeństwo

- **Rate Limiting**: Logowanie (5 prób/min), Reset (3 próby/godz)
- **Brute Force Protection**: Automatyczna blokada przez Supabase
- **XSS Protection**: Sanityzacja przez React i Shadcn/ui
- **CSRF Protection**: Cookies z `SameSite=Strict`
- **JWT Tokens**: Przechowywane w httpOnly cookies
- **Row Level Security**: Izolacja danych użytkowników w Supabase

## Zgodność z PRD

Diagram pokrywa następujące wymagania z PRD:

- **US-001**: Rejestracja konta ✅
- **US-002**: Logowanie do aplikacji ✅
- **US-003**: Kolekcje reguł (wymagają autentykacji) ✅
- **US-004**: Bezpieczny dostęp i uwierzytelnianie ✅
- **US-005**: Wylogowanie z aplikacji ✅
- **US-006**: Reset zapomnianego hasła ✅
- **US-007**: Zmiana hasła w ustawieniach konta ✅
- **US-008**: Usunięcie konta i danych (wymaga endpointu API) ⚠️
- **US-020**: Przegląd i edycja ustawień konta ✅
