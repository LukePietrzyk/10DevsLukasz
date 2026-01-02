// Shared types for backend and frontend (Entities, DTOs)
// Generic pagination DTOs are defined at the top so they can be reused by all resources.

/**
 * Common pagination query parameters accepted by list endpoints.
 * - `page` & `pageSize` are traditional paged navigation (1-based).
 * - `limit` is a convenience alternative (mutually exclusive with page/pageSize).
 */
export interface PaginationQueryDto {
  page?: number;
  pageSize?: number;
  /** Maximum number of items to return – ignored if page is supplied */
  limit?: number;
}

/**
 * Standard paginated response wrapper.
 * `data` holds the actual items; the rest is meta-information.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// import type { Tables, Enums } from "./db/database.types";

export type FlashcardSource = "manual" | "ai-full" | "ai-edited";

export interface CreateFlashcardDto {
  front: string;
  back: string;
  subject?: string;
  source?: FlashcardSource;
  generationId?: string;
}

// --- Flashcards ------------------------------------------------------------

export interface BatchCreateFlashcardsDto {
  flashcards: CreateFlashcardDto[];
}

export interface FlashcardEntity {
  id: string;
  front: string;
  back: string;
  subject: string | null;
  source: FlashcardSource;
  generationId: string | null;
  nextReviewAt: string;
  lastReviewAt: string | null;
  reviewCount: number;
  easeFactor: number;
  createdAt: string;
  updatedAt: string;
}

export type FlashcardsListResponse = PaginatedResponseDto<FlashcardEntity>;

export interface BatchCreateResponse {
  created: number;
  flashcards: FlashcardEntity[];
}

export interface ValidationError {
  index: number;
  field: string;
  message: string;
}

export interface BatchValidationErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors: ValidationError[];
}

// Review types
export type ReviewDifficulty = "hard" | "medium" | "easy";

export interface SubmitAnswerDto {
  flashcardId: string;
  difficulty: ReviewDifficulty;
  clientTimestamp: string;
  responseMs?: number;
}

export interface ReviewSessionEntity {
  sessionId: string;
  total: number;
  flashcardIds: string[];
}

export interface SubmitAnswerResponse {
  nextReviewAt: string;
  remaining: number;
}

// Query parameters for GET /api/flashcards
export interface FlashcardQueryDto extends PaginationQueryDto {
  search?: string;
  subject?: string;
  sort?: "created_at" | "next_review_at";
  order?: "asc" | "desc";
}

// Update operations for PUT/PATCH /api/flashcards/{id}
export interface UpdateFlashcardDto {
  front?: string;
  back?: string;
  subject?: string;
  source?: FlashcardSource;
  generationId?: string;
}

// Review session creation for POST /api/review-sessions
export interface CreateReviewSessionDto {
  limit?: number;
}

// RFC 7807 Problem Details for API errors
export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export interface FlashcardProposalDto {
  front: string;
  back: string;
  subject?: string;
  source?: FlashcardSource;
  generationId?: string | null;
}
