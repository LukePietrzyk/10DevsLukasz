import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";

interface FlashcardListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onStudyClick?: () => void;
  hasFlashcards?: boolean;
}

export function FlashcardListHeader({
  searchValue,
  onSearchChange,
  onAddClick,
  onStudyClick,
  hasFlashcards = false,
}: FlashcardListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <SearchBar value={searchValue} onChange={onSearchChange} />
      <div className="flex gap-2">
        {hasFlashcards && onStudyClick && (
          <Button onClick={onStudyClick} variant="secondary" className="whitespace-nowrap">
            <Eye className="h-4 w-4 mr-2" />
            Podgląd
          </Button>
        )}
        <Button onClick={onAddClick} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj fiszkę
        </Button>
      </div>
    </div>
  );
}
