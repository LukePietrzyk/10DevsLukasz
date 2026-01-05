import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateFlashcardDto, UpdateFlashcardDto, FlashcardEntity, ApiErrorResponse } from "@/types";

/**
 * Custom hook for flashcard mutations (create, update, delete).
 * Provides mutations with automatic cache invalidation for immediate UI updates.
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
      // Delay to ensure database write is committed before invalidating cache
      // Supabase may have slight replication delay, especially for subsequent writes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["flashcards"], refetchType: "active" });
        // Also force refetch to ensure data is loaded
        queryClient.refetchQueries({ queryKey: ["flashcards"], exact: false });
      }, 300);
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
      // Delay to ensure database write is committed before invalidating cache
      // Supabase may have slight replication delay, especially for subsequent writes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["flashcards"], refetchType: "active" });
        // Also force refetch to ensure data is loaded
        queryClient.refetchQueries({ queryKey: ["flashcards"], exact: false });
      }, 300);
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
      // Delay to ensure database write is committed before invalidating cache
      // Supabase may have slight replication delay, especially for subsequent writes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["flashcards"], refetchType: "active" });
        // Also force refetch to ensure data is loaded
        queryClient.refetchQueries({ queryKey: ["flashcards"], exact: false });
      }, 300);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
