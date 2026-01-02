import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function Pagination({ page, pageSize, total, totalPages, onPageChange, onPageSizeChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4" />
          Poprzednie
        </Button>
        <span className="text-sm text-muted-foreground">
          Strona {page} z {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Następna strona"
        >
          Następne
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {onPageSizeChange && (
        <div className="text-sm text-muted-foreground">
          {total} {total === 1 ? "fiszka" : total < 5 ? "fiszki" : "fiszek"}
        </div>
      )}
    </div>
  );
}
