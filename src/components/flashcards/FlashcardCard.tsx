import type { FlashcardEntity } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface FlashcardCardProps {
  flashcard: FlashcardEntity;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlashcardCard({ flashcard, onEdit, onDelete }: FlashcardCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base line-clamp-2">{flashcard.front}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{flashcard.back}</p>
        <div className="flex items-center justify-between">
          {flashcard.subject ? (
            <Badge variant="secondary">{flashcard.subject}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Brak tematu</span>
          )}
          <span className="text-xs text-muted-foreground">Powtórka: {formatDate(flashcard.nextReviewAt)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(flashcard.id)}
          aria-label={`Edytuj fiszkę: ${flashcard.front}`}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edytuj
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onDelete(flashcard.id)}
          aria-label={`Usuń fiszkę: ${flashcard.front}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
}
