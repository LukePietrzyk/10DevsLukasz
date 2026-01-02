import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit3, RotateCcw } from "lucide-react";
import { useGenerateStore } from "@/lib/stores/generate.store";
import type { FlashcardProposalDto } from "@/types";

interface ProposalCardProps {
  proposal: FlashcardProposalDto;
  index: number;
  isSelected: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, index, isSelected }) => {
  const { toggleSelect } = useGenerateStore();
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggleSelect = () => {
    toggleSelect(index);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}>
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox checked={isSelected} onCheckedChange={handleToggleSelect} className="bg-background border-2" />
      </div>

      {/* Edit button (Phase 2 feature) */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
          disabled // Will be enabled in Phase 2
          title="Edytuj fiszkę (dostępne w Phase 2)"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Flip button */}
      <div className="absolute bottom-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFlip}
          className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
          title={isFlipped ? "Pokaż przód" : "Pokaż tył"}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Card content with flip animation */}
      <CardContent className="p-6 pt-12 pb-12 min-h-[160px] cursor-pointer" onClick={handleFlip}>
        <div className="relative h-full">
          {/* Front side */}
          <div
            className={`transition-opacity duration-300 ${isFlipped ? "opacity-0 absolute inset-0" : "opacity-100"}`}
          >
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Przód</div>
              <div className="text-sm leading-relaxed">{proposal.front}</div>
              {proposal.subject && (
                <div className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                  {proposal.subject}
                </div>
              )}
            </div>
          </div>

          {/* Back side */}
          <div
            className={`transition-opacity duration-300 ${isFlipped ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          >
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tył</div>
              <div className="text-sm leading-relaxed">{proposal.back}</div>
              {proposal.source && (
                <div className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                  {proposal.source === "ai-full" ? "Wygenerowane przez AI" : proposal.source}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
