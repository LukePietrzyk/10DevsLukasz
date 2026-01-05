import { create } from "zustand";
import { supabase } from "@/db/supabase.client";
import type { User, AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email: string, password: string, redirectTo?: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Get session tokens to sync to server-side cookies
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        if (import.meta.env.DEV) {
          console.error("[Auth Store] Session error:", sessionError);
        }
        throw new Error("Failed to get session after login");
      }

      if (!sessionData.session) {
        if (import.meta.env.DEV) {
          console.error("[Auth Store] No session data after login");
        }
        throw new Error("Failed to get session after login");
      }

      // Sync session to server-side cookies via API endpoint
      // This ensures middleware can read the session
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies in request
        body: JSON.stringify({
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        }),
      });

      if (!sessionResponse.ok) {
        let errorMessage = "Failed to sync session";
        try {
          const errorData = await sessionResponse.json();
          errorMessage = errorData.error || errorMessage;
          if (import.meta.env.DEV) {
            console.error("[Auth Store] Session sync error:", errorData);
          }
        } catch (parseError) {
          if (import.meta.env.DEV) {
            console.error("[Auth Store] Failed to parse session error response:", parseError);
          }
        }
        throw new Error(errorMessage);
      }

      // Verify session was set successfully
      let sessionResponseData;
      try {
        sessionResponseData = await sessionResponse.json();
      } catch (parseError) {
        if (import.meta.env.DEV) {
          console.error("[Auth Store] Failed to parse session response:", parseError);
        }
        throw new Error("Failed to parse session response");
      }

      if (!sessionResponseData.success) {
        if (import.meta.env.DEV) {
          console.error("[Auth Store] Session verification failed:", sessionResponseData);
        }
        throw new Error("Failed to verify session after sync");
      }

      if (import.meta.env.DEV) {
        console.log("[Auth Store] Session synced successfully, user:", data.user?.email);
      }

      set({ user: data.user, loading: false });

      // Determine redirect destination
      // Default to flashcards list page if no redirect specified
      const destination = redirectTo || "/flashcards";

      if (import.meta.env.DEV) {
        console.log("[Auth Store] Login successful, redirecting to:", destination);
      }

      // Show success message immediately
      try {
        toast.success("Zalogowano pomyślnie! Przekierowywanie...");
        if (import.meta.env.DEV) {
          console.log("[Auth Store] Success toast shown");
        }
      } catch (toastError) {
        if (import.meta.env.DEV) {
          console.warn("[Auth Store] Toast error (non-critical):", toastError);
        }
      }

      // Wait a bit longer to ensure cookies are properly set
      // This gives the browser time to process and store the cookies
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (import.meta.env.DEV) {
        console.log("[Auth Store] Executing redirect to:", destination);
        console.log("[Auth Store] Current location:", window.location.href);
      }

      // Use window.location.href for full page reload
      // This ensures cookies are sent with the next request
      if (typeof window !== "undefined" && window.location) {
        if (import.meta.env.DEV) {
          console.log("[Auth Store] Redirecting with window.location.href to:", destination);
        }
        window.location.href = destination;
      } else {
        if (import.meta.env.DEV) {
          console.error("[Auth Store] window or window.location is undefined, cannot redirect");
        }
        set({ error: "Zalogowano pomyślnie, ale przekierowanie nie działa. Odśwież stronę." });
      }
    } catch (error) {
      const authError = error as AuthError | Error;
      let errorMessage = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

      if (authError && typeof authError === "object" && "message" in authError) {
        errorMessage = mapAuthError(authError as AuthError);
      }

      if (import.meta.env.DEV) {
        console.error("[Auth Store] Login error:", error);
      }

      set({
        error: errorMessage,
        loading: false,
      });

      // Show error toast
      toast.error(errorMessage);

      // Don't throw - error is displayed in UI and user stays on login page
    }
  },

  register: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      set({ user: data.user, loading: false });

      // Show success message - user needs to confirm email
      if (!data.user?.email_confirmed_at) {
        set({ error: "Sprawdź swoją skrzynkę e-mail i potwierdź konto." });
      } else {
        window.location.href = "/flashcards";
      }
    } catch (error) {
      const authError = error as AuthError;
      set({
        error: mapAuthError(authError),
        loading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      set({ user: null, loading: false, error: null });
      window.location.href = "/auth/login";
    } catch (error) {
      const authError = error as AuthError;
      set({
        error: mapAuthError(authError),
        loading: false,
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) {
        throw error;
      }

      set({
        loading: false,
        error: "Link do resetowania hasła został wysłany na Twój adres e-mail.",
      });
    } catch (error) {
      const authError = error as AuthError;
      set({
        error: mapAuthError(authError),
        loading: false,
      });
      throw error;
    }
  },

  updatePassword: async (password: string) => {
    set({ loading: true, error: null });

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      set({ loading: false });
      window.location.href = "/flashcards";
    } catch (error) {
      const authError = error as AuthError;
      set({
        error: mapAuthError(authError),
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  initialize: async () => {
    set({ loading: true });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));

// Helper function to map Supabase auth errors to user-friendly Polish messages
function mapAuthError(error: AuthError | Error): string {
  const message = error instanceof Error ? error.message : String(error);

  switch (message) {
    case "Invalid login credentials":
      return "Nieprawidłowy e-mail lub hasło.";
    case "Email not confirmed":
      return "Potwierdź swój adres e-mail przed zalogowaniem.";
    case "User already registered":
      return "Użytkownik z tym adresem e-mail już istnieje.";
    case "Password should be at least 6 characters":
      return "Hasło musi mieć co najmniej 6 znaków.";
    case "Unable to validate email address: invalid format":
      return "Nieprawidłowy format adresu e-mail.";
    case "Email rate limit exceeded":
      return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
    case "Failed to get session after login":
      return "Nie udało się pobrać sesji po zalogowaniu. Spróbuj ponownie.";
    case "Failed to sync session":
      return "Nie udało się zsynchronizować sesji. Spróbuj ponownie.";
    case "Failed to verify session after sync":
      return "Nie udało się zweryfikować sesji. Spróbuj ponownie.";
    default:
      return message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
  }
}
