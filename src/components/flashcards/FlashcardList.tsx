import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import FlashcardStudyModal from "./FlashcardStudyModal";
import { toast } from "sonner";

// Query function for fetching flashcards
async function fetchFlashcards(queryParams: FlashcardQueryDto): Promise<FlashcardsListResponse> {
  const params = new URLSearchParams();
  if (queryParams.page) params.set("page", queryParams.page.toString());
  if (queryParams.pageSize) params.set("pageSize", queryParams.pageSize.toString());
  if (queryParams.search) params.set("search", queryParams.search);
  if (queryParams.subject) params.set("subject", queryParams.subject);
  // No sort/order params - backend uses defaults (created_at desc - newest first)

  // Add cache-busting timestamp to ensure fresh data
  params.set("_t", Date.now().toString());

  const response = await fetch(`/api/flashcards?${params.toString()}`, {
    cache: "no-store", // Disable HTTP cache
  });
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw error;
  }
  return response.json();
}

export function FlashcardList() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { queryParams, updateQueryParams } = useFlashcardQueryParams();
  const { deleteMutation } = useFlashcardMutations();
  const queryClient = useQueryClient();

  // Local state
  const [searchQuery, setSearchQuery] = useState(queryParams.search || "");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<string | null>(null);
  const [deletingFlashcardFront, setDeletingFlashcardFront] = useState<string | undefined>(undefined);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);

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
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["flashcards", queryParams],
    queryFn: () => fetchFlashcards(queryParams),
    staleTime: 0, // Always refetch to ensure fresh data when params change
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // Don't use placeholderData to avoid showing stale data when sorting/filtering changes
  });

  // Track if we need to refetch after create (when page changes to 1)
  const [shouldRefetchAfterCreate, setShouldRefetchAfterCreate] = useState(false);

  // Refetch when queryParams change after create
  useEffect(() => {
    if (shouldRefetchAfterCreate && queryParams.page === 1) {
      setShouldRefetchAfterCreate(false);
      // Small delay to ensure database is ready
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["flashcards", queryParams], exact: true });
      }, 400);
    }
  }, [queryParams, shouldRefetchAfterCreate, queryClient]);

  // Handle create flashcard
  const handleCreateSuccess = async (_flashcard: FlashcardEntity, addAnother?: boolean) => {
    if (!addAnother) {
      setIsCreateModalOpen(false);
    }
    // Mark that we need to refetch after page changes to 1
    setShouldRefetchAfterCreate(true);
    // Reset to page 1 to show the newest flashcard (which will be at the top)
    updateQueryParams({ page: 1 });
    toast.success("Fiszka została dodana");
  };

  const handleCreateError = (error: ApiErrorResponse) => {
    if (error.status === 409 && error.type === "flashcard_limit_exceeded") {
      toast.error("Osiągnięto limit 2000 fiszek. Usuń niektóre fiszki, aby dodać nowe.");
    } else {
      toast.error(error.detail || "Wystąpił błąd podczas dodawania fiszki");
    }
  };

  // Handle update flashcard
  const handleUpdateSuccess = async () => {
    setIsEditModalOpen(false);
    setEditingFlashcardId(null);
    // Cache invalidation is handled in useFlashcardMutations onSuccess
    toast.success("Fiszka została zaktualizowana");
  };

  const handleUpdateError = (error: ApiErrorResponse) => {
    toast.error(error.detail || "Wystąpił błąd podczas aktualizacji fiszki");
  };

  // Handle delete flashcard
  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);

      setDeletingFlashcardId(null);
      setDeletingFlashcardFront(undefined);

      // Close study modal if open to avoid showing stale data
      if (isStudyModalOpen) {
        setIsStudyModalOpen(false);
        setStudyIndex(0);
      }

      // Cache invalidation is handled in useFlashcardMutations onSuccess
      toast.success("Fiszka została usunięta");
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

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handle add click
  const handleAddClick = () => {
    setIsCreateModalOpen(true);
  };

  // Handle study click
  const handleStudyClick = () => {
    if (data && data.data.length > 0) {
      setStudyIndex(0);
      setIsStudyModalOpen(true);
    }
  };

  // Handle study modal close
  const handleStudyModalClose = () => {
    setIsStudyModalOpen(false);
    setStudyIndex(0);
  };

  // Handle study navigation
  const handleStudyNavigate = (index: number) => {
    setStudyIndex(index);
  };

  // Get flashcard for edit
  const editingFlashcard = editingFlashcardId ? data?.data.find((f) => f.id === editingFlashcardId) : null;

  return (
    <div className="container mx-auto py-6 px-4">
      <FlashcardListHeader
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onAddClick={handleAddClick}
        onStudyClick={handleStudyClick}
        hasFlashcards={data && data.data.length > 0}
      />

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          <p className="font-semibold">Błąd ładowania fiszek</p>
          <p className="text-sm">{(error as unknown as ApiErrorResponse).detail || "Wystąpił nieoczekiwany błąd"}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline">
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Loading indicator when fetching */}
      {isFetching && !isLoading && (
        <div className="mb-4 p-3 bg-primary/10 text-primary rounded-md flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Aktualizuję listę...</span>
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

      {/* Study Modal */}
      {data && data.data.length > 0 && isStudyModalOpen && (
        <FlashcardStudyModal
          flashcards={data.data}
          currentIndex={studyIndex}
          isOpen={isStudyModalOpen}
          onClose={handleStudyModalClose}
          onNavigate={handleStudyNavigate}
        />
      )}
    </div>
  );
}
