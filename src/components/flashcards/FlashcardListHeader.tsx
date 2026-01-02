import { SearchBar } from "./SearchBar";
import { SortSelect } from "./SortSelect";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FlashcardListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: "created_at" | "next_review_at";
  orderValue: "asc" | "desc";
  onSortChange: (sort: "created_at" | "next_review_at") => void;
  onOrderChange: (order: "asc" | "desc") => void;
  onAddClick: () => void;
}

export function FlashcardListHeader({
  searchValue,
  onSearchChange,
  sortValue,
  orderValue,
  onSortChange,
  onOrderChange,
  onAddClick,
}: FlashcardListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <SearchBar value={searchValue} onChange={onSearchChange} />
      <div className="flex gap-2">
        <SortSelect
          sortValue={sortValue}
          orderValue={orderValue}
          onSortChange={onSortChange}
          onOrderChange={onOrderChange}
        />
        <Button onClick={onAddClick} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj fiszkę
        </Button>
      </div>
    </div>
  );
}
