import type { APIRoute } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import {
  BatchCreateFlashcardsSchema,
  CreateFlashcardSchema,
  type BatchCreateFlashcardsInput,
} from "../../../lib/schemas/flashcard.schemas";
import type { BatchCreateResponse, BatchValidationErrorResponse, ValidationError } from "../../../types";

export const prerender = false;

/**
 * POST /api/flashcards/batch - Create multiple flashcards in a single transaction
 * Request body:
 * {
 *   "flashcards": [
 *     {
 *       "front": "Question 1",
 *       "back": "Answer 1",
 *       "subject": "Subject 1",
 *       "source": "manual",
 *       "generationId": null
 *     },
 *     // ... up to 50 flashcards
 *   ]
 * }
 *
 * Response codes:
 * - 201: All flashcards created successfully
 * - 400: Invalid request format or validation errors
 * - 409: Flashcard limit exceeded
 * - 413: Too many flashcards in batch (>50)
 * - 422: Partial validation errors with details
 * - 500: Internal server error
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

    // Check payload size first (before detailed validation)
    if (requestBody?.flashcards && Array.isArray(requestBody.flashcards)) {
      if (requestBody.flashcards.length > 50) {
        return locals.createErrorResponse(
          413,
          "payload_too_large",
          "Payload Too Large",
          "Cannot create more than 50 flashcards in a single batch"
        );
      }

      if (requestBody.flashcards.length === 0) {
        return locals.createErrorResponse(400, "empty_batch", "Empty Batch", "At least one flashcard is required");
      }
    }

    // Validate overall batch structure
    const batchValidationResult = BatchCreateFlashcardsSchema.safeParse(requestBody);

    if (!batchValidationResult.success) {
      return locals.createErrorResponse(
        400,
        "validation_error",
        "Batch Validation Failed",
        batchValidationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    const batchData: BatchCreateFlashcardsInput = batchValidationResult.data;

    // Validate individual flashcards and collect errors
    const validationErrors: ValidationError[] = [];
    const validFlashcards: typeof batchData.flashcards = [];

    batchData.flashcards.forEach((flashcard, index) => {
      const individualValidation = CreateFlashcardSchema.safeParse(flashcard);

      if (!individualValidation.success) {
        // Collect all validation errors for this flashcard
        individualValidation.error.errors.forEach((error) => {
          validationErrors.push({
            index,
            field: error.path.join(".") || "root",
            message: error.message,
          });
        });
      } else {
        validFlashcards.push(individualValidation.data);
      }
    });

    // If there are validation errors, return 422 with detailed error information
    if (validationErrors.length > 0) {
      const errorResponse: BatchValidationErrorResponse = {
        type: "batch_validation_error",
        title: "Batch Validation Failed",
        status: 422,
        detail: `${validationErrors.length} validation error(s) found in batch`,
        errors: validationErrors,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // All flashcards are valid, proceed with creation
    const result: BatchCreateResponse = await flashcardService.createFlashcardsBatch(validFlashcards);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Created-Count": result.created.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating flashcards batch:", error);

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes("limit exceeded")) {
        return locals.createErrorResponse(409, "flashcard_limit_exceeded", "Flashcard Limit Exceeded", error.message);
      }

      if (error.message.includes("more than 50")) {
        return locals.createErrorResponse(413, "payload_too_large", "Payload Too Large", error.message);
      }
    }

    return locals.createErrorResponse(
      500,
      "internal_server_error",
      "Internal Server Error",
      "An unexpected error occurred while creating the flashcards batch"
    );
  }
};
