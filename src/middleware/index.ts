import { defineMiddleware } from "astro:middleware";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { ApiErrorResponse } from "../types";
import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/**
 * Public paths that are accessible without authentication.
 * All other paths require authentication.
 *
 * This whitelist approach is more secure - by default everything is protected.
 * Following security best practices: deny by default, allow explicitly.
 */
const publicPathPrefixes = [
  "/auth", // All authentication pages (login, register, forgot, reset)
  "/flashcards/generate", // Ad-hoc flashcard generation (available without login per PRD)
];

/**
 * Public exact paths (not prefixes)
 */
const publicExactPaths = [
  "/", // Home page
];

/**
 * API endpoints that should be handled separately (not protected by this middleware)
 * API endpoints have their own authentication logic
 */
const apiPathPrefix = "/api/";

/**
 * Static assets that should be accessible without authentication
 */
const staticAssetPrefixes = ["/_astro/", "/favicon", "/assets/", "/public/"];

/**
 * Check if a path is public (accessible without authentication)
 *
 * @param pathname - The pathname to check (e.g., "/auth/login", "/flashcards")
 * @returns true if the path is public, false otherwise
 */
function isPublicPath(pathname: string): boolean {
  // API endpoints are handled separately (they have their own auth logic)
  if (pathname.startsWith(apiPathPrefix)) {
    return true;
  }

  // Static assets are always public
  if (staticAssetPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Check exact matches
  if (publicExactPaths.includes(pathname) || pathname === "/index.html") {
    return true;
  }

  // Check path prefixes
  return publicPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Middleware for Astro that provides Supabase client and utilities
 * to all routes through context.locals
 *
 * Security: By default, all routes require authentication except those in publicPaths.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with storage adapter for server-side auth
  const serverSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false, // Server-side doesn't need auto-refresh
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: (key: string) => {
          const value = context.cookies.get(key)?.value;
          return value ?? null;
        },
        setItem: (key: string, value: string) => {
          context.cookies.set(key, value, {
            path: "/",
            httpOnly: false,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        },
        removeItem: (key: string) => {
          context.cookies.delete(key, {
            path: "/",
          });
        },
      },
    },
  });

  // Try to get authenticated user
  let user: User | null = null;
  let userId: string | null = null;
  let supabaseClient: SupabaseClient<Database> = serverSupabase;

  // Log cookie information in development
  if (import.meta.env.DEV) {
    const cookieHeader = context.request.headers.get("cookie");
    if (cookieHeader) {
      // Check for Supabase auth cookies
      const hasAuthToken = cookieHeader.includes("sb-") && cookieHeader.includes("auth-token");
      console.log(`[Middleware ${context.url.pathname}] Cookies present: ${hasAuthToken ? "YES" : "NO"}`);
      if (hasAuthToken) {
        const authCookies = cookieHeader
          .split(";")
          .filter((c) => c.includes("sb-"))
          .map((c) => c.split("=")[0].trim());
        console.log(`[Middleware ${context.url.pathname}] Auth cookies:`, authCookies.join(", "));
      }
    } else {
      console.log(`[Middleware ${context.url.pathname}] No cookies in request`);
    }
  }

  try {
    // Try to get session first (more reliable with cookies)
    const {
      data: { session },
      error: sessionError,
    } = await serverSupabase.auth.getSession();

    if (sessionError) {
      if (import.meta.env.DEV) {
        console.warn(`[Middleware ${context.url.pathname}] Session error:`, sessionError.message);
      }
    }

    if (session?.user) {
      user = session.user;
      userId = session.user.id;

      // CRITICAL: Create a new Supabase client with the user's JWT token
      // This ensures RLS policies work correctly with auth.uid()
      if (session.access_token) {
        supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        });
      }

      if (import.meta.env.DEV) {
        console.log(`[Middleware ${context.url.pathname}] User authenticated via session: ${user.email}`);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log(`[Middleware ${context.url.pathname}] No session found, trying getUser...`);
      }
      // Fallback to getUser if session is not available
      const {
        data: { user: authenticatedUser },
        error,
      } = await serverSupabase.auth.getUser();

      if (error) {
        if (import.meta.env.DEV) {
          console.warn(`[Middleware ${context.url.pathname}] Auth error:`, error.message);
        }
      }

      user = authenticatedUser || null;
      userId = authenticatedUser?.id || null;
      if (import.meta.env.DEV) {
        if (user) {
          console.log(`[Middleware ${context.url.pathname}] User authenticated via getUser: ${user.email}`);
        } else {
          console.log(`[Middleware ${context.url.pathname}] No user found via getUser`);
        }
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[Middleware ${context.url.pathname}] Failed to get user:`, error);
    }
  }

  // Add Supabase client to context
  // Note: We always use the authenticated client (no service_role bypass)
  // Users must register/login through the normal authentication flow
  context.locals.supabase = supabaseClient;

  // Add user and authentication state to context
  context.locals.user = user;
  context.locals.userId = userId || null;
  context.locals.isAuthenticated = !!user;

  // Helper to require authentication (throws error if not authenticated)
  context.locals.requireAuth = (): User => {
    if (!user) {
      throw new Error("Authentication required");
    }
    return user;
  };

  // Universal protection: redirect to login if accessing non-public path without authentication
  // This ensures all pages except public ones require authentication
  const isPublic = isPublicPath(context.url.pathname);

  if (!isPublic && !user) {
    if (import.meta.env.DEV) {
      console.log(`[Middleware ${context.url.pathname}] Redirecting to login - no user found`);
    }
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(context.url.pathname)}`;
    return Response.redirect(new URL(redirectUrl, context.url.origin), 302);
  }

  // Helper to create standardized API error responses (RFC 7807)
  context.locals.createErrorResponse = (
    status: number,
    type: string,
    title: string,
    detail: string,
    instance?: string
  ): Response => {
    const errorResponse: ApiErrorResponse = {
      type,
      title,
      status,
      detail,
      instance: instance || context.url.pathname,
    };

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return next();
});
