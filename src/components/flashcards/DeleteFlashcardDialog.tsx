import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardId: string | null;
  flashcardFront?: string;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteFlashcardDialog({
  isOpen,
  onClose,
  flashcardId,
  flashcardFront,
  onConfirm,
}: DeleteFlashcardDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!flashcardId) return;

    setIsDeleting(true);
    try {
      await onConfirm(flashcardId);
      onClose();
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      // Error handling is done in parent component
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
          <AlertDialogDescription>
            {flashcardFront ? (
              <>
                Na pewno chcesz usunąć fiszkę <strong>"{flashcardFront}"</strong>? Tej operacji nie można cofnąć.
              </>
            ) : (
              <>Na pewno chcesz usunąć tę fiszkę? Tej operacji nie można cofnąć.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || !flashcardId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
