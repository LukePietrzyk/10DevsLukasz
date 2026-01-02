import { z } from "zod";

// Base flashcard validation schema
const flashcardSourceSchema = z.enum(["manual", "ai-full", "ai-edited"] as const);

// Schema for creating a single flashcard
export const CreateFlashcardSchema = z
  .object({
    front: z.string().min(1, "Front text is required").max(2000, "Front text cannot exceed 2000 characters").trim(),
    back: z.string().min(1, "Back text is required").max(2000, "Back text cannot exceed 2000 characters").trim(),
    subject: z
      .string()
      .max(100, "Subject cannot exceed 100 characters")
      .trim()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
    source: flashcardSourceSchema.default("manual"),
    generationId: z.string().uuid("Generation ID must be a valid UUID").optional().nullable(),
  })
  .refine(
    (data) => {
      // If source is ai-full or ai-edited, generationId is required
      if ((data.source === "ai-full" || data.source === "ai-edited") && !data.generationId) {
        return false;
      }
      // If source is manual, generationId should be null
      if (data.source === "manual" && data.generationId) {
        return false;
      }
      return true;
    },
    {
      message: "Generation ID is required for AI-generated flashcards and must be null for manual ones",
      path: ["generationId"],
    }
  );

// Schema for batch creating flashcards
export const BatchCreateFlashcardsSchema = z.object({
  flashcards: z
    .array(CreateFlashcardSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Cannot create more than 50 flashcards at once"),
});

// Schema for query parameters in GET /api/flashcards
export const FlashcardQuerySchema = z
  .object({
    // Pagination parameters (mutually exclusive with limit)
    page: z.coerce.number().int("Page must be an integer").min(1, "Page must be at least 1").optional(),
    pageSize: z.coerce
      .number()
      .int("Page size must be an integer")
      .min(1, "Page size must be at least 1")
      .max(50, "Page size cannot exceed 50")
      .optional(),

    // Alternative to pagination
    limit: z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
      .optional(),

    // Search and filtering
    search: z.string().max(200, "Search term cannot exceed 200 characters").trim().optional(),
    subject: z.string().max(100, "Subject filter cannot exceed 100 characters").trim().optional(),

    // Sorting
    sort: z.enum(["created_at", "next_review_at"]).default("created_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    (data) => {
      // page and pageSize must be used together, and are mutually exclusive with limit
      const hasPageParams = data.page !== undefined || data.pageSize !== undefined;
      const hasLimit = data.limit !== undefined;

      if (hasPageParams && hasLimit) {
        return false;
      }

      // If page is provided, pageSize must also be provided (and vice versa)
      if (
        (data.page !== undefined && data.pageSize === undefined) ||
        (data.page === undefined && data.pageSize !== undefined)
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Use either (page + pageSize) or limit, not both. Page and pageSize must be used together.",
      path: ["page"],
    }
  );

// Schema for updating flashcards (PUT/PATCH)
export const UpdateFlashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front text is required")
      .max(2000, "Front text cannot exceed 2000 characters")
      .trim()
      .optional(),
    back: z
      .string()
      .min(1, "Back text is required")
      .max(2000, "Back text cannot exceed 2000 characters")
      .trim()
      .optional(),
    subject: z.string().max(100, "Subject cannot exceed 100 characters").trim().optional().nullable(),
    source: flashcardSourceSchema.optional(),
    generationId: z.string().uuid("Generation ID must be a valid UUID").optional().nullable(),
  })
  .refine(
    (data) => {
      // If source is provided and is ai-full or ai-edited, generationId must be provided
      if (data.source && (data.source === "ai-full" || data.source === "ai-edited") && !data.generationId) {
        return false;
      }
      // If source is manual, generationId should be null
      if (data.source === "manual" && data.generationId) {
        return false;
      }
      return true;
    },
    {
      message: "Generation ID is required for AI-generated flashcards and must be null for manual ones",
      path: ["generationId"],
    }
  );

// Schema for UUID parameter validation
export const UuidParamSchema = z.string().uuid("Invalid flashcard ID format");

// Export types for use in other files
export type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;
export type BatchCreateFlashcardsInput = z.infer<typeof BatchCreateFlashcardsSchema>;
export type FlashcardQueryInput = z.infer<typeof FlashcardQuerySchema>;
export type UpdateFlashcardInput = z.infer<typeof UpdateFlashcardSchema>;
