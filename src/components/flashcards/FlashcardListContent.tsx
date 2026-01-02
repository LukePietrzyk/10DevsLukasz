import type { FlashcardEntity } from "@/types";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";
import { FlashcardTable } from "./FlashcardTable";
import { FlashcardCardList } from "./FlashcardCardList";

interface FlashcardListContentProps {
  isLoading: boolean;
  flashcards: FlashcardEntity[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
  isMobile: boolean;
}

export function FlashcardListContent({
  isLoading,
  flashcards,
  onEdit,
  onDelete,
  onAddClick,
  isMobile,
}: FlashcardListContentProps) {
  if (isLoading) {
    return <SkeletonLoader isMobile={isMobile} />;
  }

  if (flashcards.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  if (isMobile) {
    return <FlashcardCardList flashcards={flashcards} onEdit={onEdit} onDelete={onDelete} />;
  }

  return <FlashcardTable flashcards={flashcards} onEdit={onEdit} onDelete={onDelete} />;
}
