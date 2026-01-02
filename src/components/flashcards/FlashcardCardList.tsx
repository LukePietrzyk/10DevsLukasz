import type { FlashcardEntity } from "@/types";
import { FlashcardCard } from "./FlashcardCard";

interface FlashcardCardListProps {
  flashcards: FlashcardEntity[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlashcardCardList({ flashcards, onEdit, onDelete }: FlashcardCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {flashcards.map((flashcard) => (
        <FlashcardCard key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
