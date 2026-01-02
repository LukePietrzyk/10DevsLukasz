import type { APIRoute } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import {
  FlashcardQuerySchema,
  CreateFlashcardSchema,
  type FlashcardQueryInput,
  type CreateFlashcardInput,
} from "../../../lib/schemas/flashcard.schemas";
import type { FlashcardsListResponse, FlashcardEntity, ApiErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards - List flashcards with pagination, filtering, and sorting
 * Query parameters:
 * - page?: number (default: 1)
 * - pageSize?: number (default: 50, max: 50)
 * - limit?: number (alternative to page/pageSize, max: 100)
 * - search?: string (full-text search)
 * - subject?: string (exact match filter)
 * - sort?: "created_at" | "next_review_at" (default: "created_at")
 * - order?: "asc" | "desc" (default: "desc")
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const flashcardService = new FlashcardService(locals.supabase, locals.userId);

    // Parse and validate query parameters
    const queryParams: Record<string, string | undefined> = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryParams[key] = value;
    }

    const validationResult = FlashcardQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return locals.createErrorResponse(
        400,
        "validation_error",
        "Invalid Query Parameters",
        validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const query: FlashcardQueryInput = validationResult.data;

    // Get flashcards from service
    const result: FlashcardsListResponse = await flashcardService.getFlashcards(query);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Add caching headers for GET requests
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
        ETag: `"${Date.now()}"`, // Simple ETag based on timestamp
      },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while fetching flashcards"
    );
  }
};

/**
 * POST /api/flashcards - Create a single flashcard
 * Request body:
 * {
 *   "front": "Question text",
 *   "back": "Answer text",
 *   "subject": "Optional subject",
 *   "source": "manual" | "ai-full" | "ai-edited",
 *   "generationId": "uuid" (required for AI sources)
 * }
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const flashcardService = new FlashcardService(locals.supabase, locals.userId);

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return locals.createErrorResponse(400, "invalid_json", "Invalid JSON", "Request body must be valid JSON");
    }

    // Validate request body
    const validationResult = CreateFlashcardSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return locals.createErrorResponse(
        400,
        "validation_error",
        "Validation Failed",
        validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const flashcardData: CreateFlashcardInput = validationResult.data;

    // Create flashcard
    const newFlashcard: FlashcardEntity = await flashcardService.createFlashcard(flashcardData);

    return new Response(JSON.stringify(newFlashcard), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/flashcards/${newFlashcard.id}`,
      },
    });
  } catch (error) {
    console.error("Error creating flashcard:", error);

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes("limit exceeded")) {
        return locals.createErrorResponse(409, "flashcard_limit_exceeded", "Flashcard Limit Exceeded", error.message);
      }

      if (error.message.includes("already exists")) {
        return locals.createErrorResponse(409, "duplicate_flashcard", "Duplicate Flashcard", error.message);
      }
    }

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while creating the flashcard"
    );
  }
};
