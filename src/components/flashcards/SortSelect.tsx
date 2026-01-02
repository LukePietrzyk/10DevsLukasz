import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SortSelectProps {
  sortValue: "created_at" | "next_review_at";
  orderValue: "asc" | "desc";
  onSortChange: (sort: "created_at" | "next_review_at") => void;
  onOrderChange: (order: "asc" | "desc") => void;
}

export function SortSelect({ sortValue, orderValue, onSortChange, onOrderChange }: SortSelectProps) {
  return (
    <div className="flex gap-2">
      <Select value={sortValue} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sortuj po" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Data utworzenia</SelectItem>
          <SelectItem value="next_review_at">Data powtórki</SelectItem>
        </SelectContent>
      </Select>
      <Select value={orderValue} onValueChange={onOrderChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Kierunek" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Rosnąco</SelectItem>
          <SelectItem value="desc">Malejąco</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
