import { create } from "zustand";
import { supabase } from "@/db/supabase.client";
import type { User, AuthError } from "@supabase/supabase-js";

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

export const useAuthStore = create<AuthState>((set, get) => ({
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

      set({ user: data.user, loading: false });

      // Determine redirect destination
      // Default to flashcards list page if no redirect specified
      const destination = redirectTo || "/flashcards";

      // Server-side redirect by reloading the page
      // This ensures middleware runs and user state is properly set
      window.location.href = destination;
    } catch (error) {
      const authError = error as AuthError;
      set({
        error: mapAuthError(authError),
        loading: false,
      });
      throw error;
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
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
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
    } catch (error) {
      set({ user: null, loading: false });
    }
  },
}));

// Helper function to map Supabase auth errors to user-friendly Polish messages
function mapAuthError(error: AuthError): string {
  switch (error.message) {
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
    default:
      return error.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
  }
}
