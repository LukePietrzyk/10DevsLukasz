// Shared types for backend and frontend (Entities, DTOs)

export type FlashcardSource = "manual" | "ai-full" | "ai-edited";

export interface CreateFlashcardDto {
  front: string;
  back: string;
  subject?: string;
  source?: FlashcardSource;
  generationId?: string;
}

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
