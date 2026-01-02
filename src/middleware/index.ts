import { defineMiddleware } from "astro:middleware";

import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client";
import type { ApiErrorResponse } from "../types";

/**
 * Middleware for Astro that provides Supabase client and utilities
 * to all routes through context.locals
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // Add default user ID for development (no auth)
  context.locals.userId = DEFAULT_USER_ID;

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
