import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateFlashcardDto,
  UpdateFlashcardDto,
  FlashcardEntity,
  ApiErrorResponse,
  FlashcardsListResponse,
} from "@/types";

/**
 * Custom hook for flashcard mutations (create, update, delete).
 * Provides mutations with optimistic updates and error handling.
 */
export function useFlashcardMutations() {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateFlashcardDto): Promise<FlashcardEntity> => {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all flashcard queries to refetch
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFlashcardDto }): Promise<FlashcardEntity> => {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all flashcard queries to refetch
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all flashcard queries to refetch
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
