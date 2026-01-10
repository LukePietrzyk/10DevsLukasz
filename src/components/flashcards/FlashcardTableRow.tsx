import type { FlashcardEntity } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { Pencil, Trash2 } from "lucide-react";

interface FlashcardTableRowProps {
  flashcard: FlashcardEntity;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlashcardTableRow({ flashcard, onEdit, onDelete }: FlashcardTableRowProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TableRow>
      <TableCell className="max-w-[300px]">
        <div className="truncate" title={flashcard.front}>
          <MarkdownContent content={flashcard.front} size="sm" className="truncate" />
        </div>
      </TableCell>
      <TableCell className="max-w-[300px]">
        <div className="truncate" title={flashcard.back}>
          <MarkdownContent
            content={flashcard.back.length > 50 ? `${flashcard.back.substring(0, 50)}...` : flashcard.back}
            size="sm"
            className="truncate"
          />
        </div>
      </TableCell>
      <TableCell>
        {flashcard.subject ? (
          <Badge variant="secondary">{flashcard.subject}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>{formatDate(flashcard.nextReviewAt)}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(flashcard.id)}
            aria-label={`Edytuj fiszkę: ${flashcard.front}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(flashcard.id)}
            aria-label={`Usuń fiszkę: ${flashcard.front}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
