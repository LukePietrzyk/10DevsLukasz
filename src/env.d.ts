/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";
import type { User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;
      userId: string | null;
      isAuthenticated: boolean;
      requireAuth: () => User;
      createErrorResponse: (status: number, type: string, title: string, detail: string, instance?: string) => Response;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: "http://127.0.0.1:54321";
  readonly SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
