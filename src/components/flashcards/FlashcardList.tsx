import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FlashcardEntity, FlashcardQueryDto, FlashcardsListResponse, ApiErrorResponse } from "@/types";
import { useFlashcardQueryParams } from "@/components/hooks/useFlashcardQueryParams";
import { useFlashcardMutations } from "@/components/hooks/useFlashcardMutations";
import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import { useDebounce } from "@/components/hooks/useDebounce";
import { FlashcardListHeader } from "./FlashcardListHeader";
import { FlashcardListContent } from "./FlashcardListContent";
import { Pagination } from "./Pagination";
import { FlashcardForm } from "./FlashcardForm";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { toast } from "sonner";

// Query function for fetching flashcards
async function fetchFlashcards(queryParams: FlashcardQueryDto): Promise<FlashcardsListResponse> {
  const params = new URLSearchParams();
  if (queryParams.page) params.set("page", queryParams.page.toString());
  if (queryParams.pageSize) params.set("pageSize", queryParams.pageSize.toString());
  if (queryParams.search) params.set("search", queryParams.search);
  if (queryParams.subject) params.set("subject", queryParams.subject);
  if (queryParams.sort) params.set("sort", queryParams.sort);
  if (queryParams.order) params.set("order", queryParams.order);

  const response = await fetch(`/api/flashcards?${params.toString()}`);
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw error;
  }
  return response.json();
}

export function FlashcardList() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { queryParams, updateQueryParams } = useFlashcardQueryParams();
  const { createMutation, updateMutation, deleteMutation } = useFlashcardMutations();

  // Local state
  const [searchQuery, setSearchQuery] = useState(queryParams.search || "");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<string | null>(null);
  const [deletingFlashcardFront, setDeletingFlashcardFront] = useState<string | undefined>(undefined);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    updateQueryParams({ search: debouncedSearch || undefined, page: 1 });
  }, [debouncedSearch, updateQueryParams]);

  // Sync local search state with URL params
  useEffect(() => {
    setSearchQuery(queryParams.search || "");
  }, [queryParams.search]);

  // React Query for fetching flashcards
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["flashcards", queryParams],
    queryFn: () => fetchFlashcards(queryParams),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData, // keepPreviousData equivalent
  });

  // Handle create flashcard
  const handleCreateSuccess = (flashcard: FlashcardEntity, addAnother?: boolean) => {
    toast.success("Fiszka została dodana");
    if (!addAnother) {
      setIsCreateModalOpen(false);
    }
    refetch();
  };

  const handleCreateError = (error: ApiErrorResponse) => {
    if (error.status === 409 && error.type === "flashcard_limit_exceeded") {
      toast.error("Osiągnięto limit 2000 fiszek. Usuń niektóre fiszki, aby dodać nowe.");
    } else {
      toast.error(error.detail || "Wystąpił błąd podczas dodawania fiszki");
    }
  };

  // Handle update flashcard
  const handleUpdateSuccess = (flashcard: FlashcardEntity) => {
    toast.success("Fiszka została zaktualizowana");
    setIsEditModalOpen(false);
    setEditingFlashcardId(null);
    refetch();
  };

  const handleUpdateError = (error: ApiErrorResponse) => {
    toast.error(error.detail || "Wystąpił błąd podczas aktualizacji fiszki");
  };

  // Handle delete flashcard
  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Fiszka została usunięta");
      setDeletingFlashcardId(null);
      setDeletingFlashcardFront(undefined);
      refetch();
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      toast.error(apiError.detail || "Wystąpił błąd podczas usuwania fiszki");
      throw error;
    }
  };

  // Handle edit click
  const handleEdit = (id: string) => {
    setEditingFlashcardId(id);
    setIsEditModalOpen(true);
  };

  // Handle delete click
  const handleDelete = (id: string) => {
    const flashcard = data?.data.find((f) => f.id === id);
    setDeletingFlashcardId(id);
    setDeletingFlashcardFront(flashcard?.front);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateQueryParams({ page });
  };

  // Handle sort change
  const handleSortChange = (sort: "created_at" | "next_review_at") => {
    updateQueryParams({ sort, page: 1 });
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    updateQueryParams({ order, page: 1 });
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handle add click
  const handleAddClick = () => {
    setIsCreateModalOpen(true);
  };

  // Get flashcard for edit
  const editingFlashcard = editingFlashcardId ? data?.data.find((f) => f.id === editingFlashcardId) : null;

  return (
    <div className="container mx-auto py-6 px-4">
      <FlashcardListHeader
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        sortValue={queryParams.sort || "created_at"}
        orderValue={queryParams.order || "desc"}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
        onAddClick={handleAddClick}
      />

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          <p className="font-semibold">Błąd ładowania fiszek</p>
          <p className="text-sm">{(error as ApiErrorResponse).detail || "Wystąpił nieoczekiwany błąd"}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline">
            Spróbuj ponownie
          </button>
        </div>
      )}

      <FlashcardListContent
        isLoading={isLoading}
        flashcards={data?.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddClick={handleAddClick}
        isMobile={isMobile}
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Create Modal */}
      <FlashcardForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSuccess={handleCreateSuccess}
        onError={handleCreateError}
      />

      {/* Edit Modal */}
      <FlashcardForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFlashcardId(null);
        }}
        mode="edit"
        flashcardId={editingFlashcardId || undefined}
        onSuccess={handleUpdateSuccess}
        onError={handleUpdateError}
      />

      {/* Delete Dialog */}
      <DeleteFlashcardDialog
        isOpen={deletingFlashcardId !== null}
        onClose={() => {
          setDeletingFlashcardId(null);
          setDeletingFlashcardFront(undefined);
        }}
        flashcardId={deletingFlashcardId}
        flashcardFront={deletingFlashcardFront}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
