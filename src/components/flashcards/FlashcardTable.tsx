import type { FlashcardEntity } from "@/types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlashcardTableRow } from "./FlashcardTableRow";

interface FlashcardTableProps {
  flashcards: FlashcardEntity[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlashcardTable({ flashcards, onEdit, onDelete }: FlashcardTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Front</TableHead>
            <TableHead>Back</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Next Review</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashcards.map((flashcard) => (
            <FlashcardTableRow key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
