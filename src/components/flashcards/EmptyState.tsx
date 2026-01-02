import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Nie masz jeszcze fiszek</h3>
      <p className="text-muted-foreground text-center mb-6">Zacznij od dodania swojej pierwszej fiszki</p>
      <Button onClick={onAddClick}>Dodaj fiszkę</Button>
    </div>
  );
}
