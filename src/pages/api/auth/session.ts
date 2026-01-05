import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../../../db/database.types";

export const prerender = false;

// Schema for session endpoint validation
const SessionRequestSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
  refresh_token: z.string().min(1, "Refresh token is required"),
});

const supabaseUrl = import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/**
 * POST /api/auth/session - Set session cookies after client-side login
 * Body: { access_token: string, refresh_token: string }
 *
 * This endpoint is called after successful client-side login to sync
 * the session to server-side cookies so middleware can read it.
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();

    // Validate request body with zod
    const validationResult = SessionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return locals.createErrorResponse(
        400,
        "validation_error",
        "Invalid Request Body",
        validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const { access_token, refresh_token } = validationResult.data;

    // Create a Supabase client with cookie adapter
    // This will allow Supabase to properly manage session cookies
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: {
          getItem: (key: string) => {
            const value = cookies.get(key)?.value;
            if (import.meta.env.DEV && value) {
              console.log(`[Session API] Storage getItem: ${key.substring(0, 30)}...`);
            }
            return value ?? null;
          },
          setItem: (key: string, value: string) => {
            if (import.meta.env.DEV) {
              console.log(`[Session API] Storage setItem: ${key.substring(0, 30)}...`);
            }
            cookies.set(key, value, {
              path: "/",
              httpOnly: false, // Must be false for client-side Supabase access
              secure: import.meta.env.PROD,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
          },
          removeItem: (key: string) => {
            if (import.meta.env.DEV) {
              console.log(`[Session API] Storage removeItem: ${key.substring(0, 30)}...`);
            }
            cookies.delete(key, {
              path: "/",
            });
          },
        },
      },
    });

    // Set the session using the tokens - this will set additional cookies
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Session API] setSession error:", error.message);
      }
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (import.meta.env.DEV) {
      console.log("[Session API] Session set successfully, user:", data.user?.email);
    }

    // Verify session
    const { data: verifyData, error: verifyError } = await supabase.auth.getUser();

    if (verifyError || !verifyData.user) {
      if (import.meta.env.DEV) {
        console.error("[Session API] Failed to verify session:", verifyError?.message);
      }
      return new Response(
        JSON.stringify({
          error: "Failed to verify session after setting cookies",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (import.meta.env.DEV) {
      console.log("[Session API] Session verified successfully. User:", verifyData.user?.email);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: data.user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
