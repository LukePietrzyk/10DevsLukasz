# Plan implementacji widoku Autoryzacji

## 1. Przegląd
Widok autoryzacji obejmuje komplet ekranów pozwalających użytkownikowi na utworzenie konta, zalogowanie się, zresetowanie hasła i ustawienie nowego hasła. Ekrany muszą być spójne wizualnie (layout kart) oraz w pełni dostępne (WCAG), zapewniając natychmiastowe komunikaty walidacyjne i obsługę stanu ładowania/błędów.

## 2. Routing widoku
| Ścieżka | Widok |
|---------|-------|
| `/auth/register` | Rejestracja |
| `/auth/login`    | Logowanie |
| `/auth/forgot`   | Żądanie resetu hasła |
| `/auth/reset`    | Ustawienie nowego hasła (token w query) |

Każda ścieżka renderuje ten sam layout (`AuthLayout`) z różnymi formularzami.

## 3. Struktura komponentów
```
AuthLayout (centered card, logo)
 ├── RegisterForm | LoginForm | ForgotForm | ResetForm
      ├── EmailInput
      ├── PasswordInput    (Register/Login/Reset)
      ├── PasswordConfirm  (Register/Reset)
      ├── SubmitButton
      └── FormError / InfoAlert
```

## 4. Szczegóły komponentów
### AuthLayout
- **Opis:** Wspólny układ kartowy, wyrównany do środka ekranu. Zawiera logo i slot na formularz.
- **Główne elementy:** `<header>` z logo, `<main>` z `children`, opcjonalnie stopka.
- **Interakcje:** Brak, jedynie render.
- **Walidacja:** —
- **Typy:** `AuthLayoutProps { children: ReactNode }`
- **Propsy:** `children`

### EmailInput
- **Opis:** Pola e-mail używane we wszystkich formularzach. Wyświetla błąd walidacji.
- **Główne elementy:** `<Input type="email" />`, `<FormMessage>`
- **Interakcje:** `onChange`, `onBlur` – delegowane do React Hook Form.
- **Walidacja:** wymagane, valid e-mail (Zod: `email()`)
- **Typy:** — (zgłaszany wewnątrz RHF)
- **Propsy:** `name` (string)

### PasswordInput
- **Opis:** Standardowe pole hasła z przyciskiem pokaż/ukryj.
- **Walidacja:** min 8 znaków.

### PasswordConfirm
- **Opis:** Potwierdzenie hasła. 
- **Walidacja:** musi być identyczne z `password` (RHF `validate`)

### SubmitButton
- **Opis:** Przycisk wysyłający formularz z spinnerem.

### FormError / InfoAlert
- **Opis:** Komponent wyświetlający komunikaty błędów (API/serwer) lub informacyjne.

### RegisterForm
- **Opis:** Formularz rejestracji.
- **Elementy:** EmailInput, PasswordInput, PasswordConfirm, SubmitButton, Link to login.
- **Zdarzenia:** `onSubmit` → `supabase.auth.signUp()`
- **Walidacja:** email, hasło ≥8, potwierdzenie.
- **Typy:** `RegisterFormValues { email: string; password: string; confirm: string }`
- **Propsy:** —

### LoginForm
(Identyfikacja analogiczna do RegisterForm)

### ForgotForm
- **Opis:** Pole e-mail. Wysyła zapytanie o reset.
- **Zdarzenia:** `supabase.auth.resetPasswordForEmail()`

### ResetForm
- **Opis:** Ustawienie nowego hasła z tokenu (`?token=`)
- **Zdarzenia:** `supabase.auth.updateUser({ password })`
- **Walidacja:** hasło, potwierdzenie.

## 5. Typy
```typescript
// Formularze
export interface RegisterFormValues { email: string; password: string; confirm: string }
export interface LoginFormValues    { email: string; password: string }
export interface ForgotFormValues   { email: string }
export interface ResetFormValues    { password: string; confirm: string }

// Odpowiedzi API
export interface AuthError { message: string; code?: string }
```

## 6. Zarządzanie stanem
Globalny stan auth (token, user) trzymany w `useAuthStore` (Zustand):
```ts
interface AuthState {
  user: User | null;
  loading: boolean;
  login(email, pass): Promise<void>;
  register(email, pass): Promise<void>;
  logout(): Promise<void>;
}
```
Formularze korzystają z lokalnego stanu RHF + Zod, a akcje wywołują metody store.

## 7. Integracja API
- Rejestracja: `supabase.auth.signUp({ email, password })`
- Logowanie: `supabase.auth.signInWithPassword({ email, password })`
- Reset request: `supabase.auth.resetPasswordForEmail(email)`
- Reset confirm: `supabase.auth.updateUser({ password })` (po walidacji tokenu)

Typy odpowiedzi dostarcza SDK Supabase (`AuthError`, `Session`, `User`). Błędy mapujemy na `FormError`.

## 8. Interakcje użytkownika
- Wpisanie danych → live walidacja → przycisk aktywny.
- Submit → spinner → sukces = redirect (`/dashboard`) / info alert („Sprawdź skrzynkę”)
- Błąd → komunikat w `FormError`.

## 9. Warunki i walidacja
- Email wymagany i poprawny format.
- Hasło min 8 znaków, confirm = password.
- Token resetu obecny w URL.

## 10. Obsługa błędów
- Błędy Supabase (`AuthError`) mapowane na przyjazne PL komunikaty.
- Błąd sieci → toast globalny.
- Status `429` (rate-limit) → info alert z cooldownem.

## 11. Kroki implementacji
1. Utworzyć `AuthLayout` i dodać routing w `src/pages/auth/*.astro`.
2. Zainstalować `@supabase/auth-helpers` + RHF + Zod.
3. Zaimplementować store `useAuthStore`.
4. Zaimplementować formularze z walidacją Zod.
5. Dodać obsługę redirectów po sukcesie.
6. Dodać komunikaty błędów i toasty.
7. Napisać testy jednostkowe walidacji formularzy.
8. Pokryć E2E (register→login flow) w Playwright.

