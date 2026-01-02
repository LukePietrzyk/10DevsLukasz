import type { APIRoute } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import {
  UpdateFlashcardSchema,
  UuidParamSchema,
  type UpdateFlashcardInput,
} from "../../../lib/schemas/flashcard.schemas";
import type { FlashcardEntity } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards/{id} - Get a single flashcard by ID
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const flashcardService = new FlashcardService(locals.supabase, locals.userId);

    // Validate flashcard ID parameter
    const idValidation = UuidParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      return locals.createErrorResponse(400, "invalid_id", "Invalid Flashcard ID", "Flashcard ID must be a valid UUID");
    }

    const flashcardId = idValidation.data;

    // Get flashcard from service
    const flashcard: FlashcardEntity | null = await flashcardService.getFlashcardById(flashcardId);

    if (!flashcard) {
      return locals.createErrorResponse(
        404,
        "flashcard_not_found",
        "Flashcard Not Found",
        `Flashcard with ID ${flashcardId} was not found`
      );
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Add caching headers
        "Cache-Control": "private, max-age=300", // Cache for 5 minutes
        ETag: `"${flashcard.updatedAt}"`,
      },
    });
  } catch (error) {
    console.error("Error fetching flashcard:", error);

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while fetching the flashcard"
    );
  }
};

/**
 * PUT /api/flashcards/{id} - Full update of a flashcard
 * Request body: Complete FlashcardEntity (all fields required)
 */
export const PUT: APIRoute = async ({ locals, params, request }) => {
  try {
    const flashcardService = new FlashcardService(locals.supabase, locals.userId);

    // Validate flashcard ID parameter
    const idValidation = UuidParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      return locals.createErrorResponse(400, "invalid_id", "Invalid Flashcard ID", "Flashcard ID must be a valid UUID");
    }

    const flashcardId = idValidation.data;

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return locals.createErrorResponse(400, "invalid_json", "Invalid JSON", "Request body must be valid JSON");
    }

    // For PUT, we require all fields (full update)
    // Validate that required fields are present
    if (!requestBody.front || !requestBody.back) {
      return locals.createErrorResponse(
        400,
        "missing_required_fields",
        "Missing Required Fields",
        "PUT requests require both 'front' and 'back' fields"
      );
    }

    // Validate request body
    const validationResult = UpdateFlashcardSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return locals.createErrorResponse(
        400,
        "validation_error",
        "Validation Failed",
        validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const updateData: UpdateFlashcardInput = validationResult.data;

    // Update flashcard
    const updatedFlashcard: FlashcardEntity | null = await flashcardService.updateFlashcard(flashcardId, updateData);

    if (!updatedFlashcard) {
      return locals.createErrorResponse(
        404,
        "flashcard_not_found",
        "Flashcard Not Found",
        `Flashcard with ID ${flashcardId} was not found`
      );
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while updating the flashcard"
    );
  }
};

/**
 * PATCH /api/flashcards/{id} - Partial update of a flashcard
 * Request body: Partial FlashcardEntity (only fields to update)
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const flashcardService = new FlashcardService(locals.supabase, locals.userId);

    // Validate flashcard ID parameter
    const idValidation = UuidParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      return locals.createErrorResponse(400, "invalid_id", "Invalid Flashcard ID", "Flashcard ID must be a valid UUID");
    }

    const flashcardId = idValidation.data;

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return locals.createErrorResponse(400, "invalid_json", "Invalid JSON", "Request body must be valid JSON");
    }

    // For PATCH, we allow partial updates
    // Check that at least one field is provided
    const hasUpdates = Object.keys(requestBody).some((key) =>
      ["front", "back", "subject", "source", "generationId"].includes(key)
    );

    if (!hasUpdates) {
      return locals.createErrorResponse(
        400,
        "no_updates_provided",
        "No Updates Provided",
        "At least one field must be provided for update"
      );
    }

    // Validate request body
    const validationResult = UpdateFlashcardSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return locals.createErrorResponse(
        400,
        "validation_error",
        "Validation Failed",
        validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const updateData: UpdateFlashcardInput = validationResult.data;

    // Update flashcard
    const updatedFlashcard: FlashcardEntity | null = await flashcardService.updateFlashcard(flashcardId, updateData);

    if (!updatedFlashcard) {
      return locals.createErrorResponse(
        404,
        "flashcard_not_found",
        "Flashcard Not Found",
        `Flashcard with ID ${flashcardId} was not found`
      );
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while updating the flashcard"
    );
  }
};

/**
 * DELETE /api/flashcards/{id} - Delete a flashcard
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const flashcardService = new FlashcardService(locals.supabase, locals.userId);

    // Validate flashcard ID parameter
    const idValidation = UuidParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      return locals.createErrorResponse(400, "invalid_id", "Invalid Flashcard ID", "Flashcard ID must be a valid UUID");
    }

    const flashcardId = idValidation.data;

    // Check if flashcard exists first
    const existingFlashcard = await flashcardService.getFlashcardById(flashcardId);

    if (!existingFlashcard) {
      return locals.createErrorResponse(
        404,
        "flashcard_not_found",
        "Flashcard Not Found",
        `Flashcard with ID ${flashcardId} was not found`
      );
    }

    // Delete flashcard
    await flashcardService.deleteFlashcard(flashcardId);

    return new Response(null, {
      status: 204, // No Content
    });
  } catch (error) {
    console.error("Error deleting flashcard:", error);

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while deleting the flashcard"
    );
  }
};
