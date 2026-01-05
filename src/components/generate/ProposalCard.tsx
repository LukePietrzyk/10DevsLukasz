import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, RotateCcw, Check, X } from "lucide-react";
import { useGenerateStore } from "@/lib/stores/generate.store";
import type { FlashcardProposalDto } from "@/types";

interface ProposalCardProps {
  proposal: FlashcardProposalDto;
  index: number;
  isSelected: boolean;
  onCardClick?: (index: number) => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, index, isSelected, onCardClick }) => {
  const { toggleSelect, updateProposal } = useGenerateStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(proposal.front);
  const [editedBack, setEditedBack] = useState(proposal.back);
  const [editedSubject, setEditedSubject] = useState(proposal.subject || "");

  const handleToggleSelect = () => {
    toggleSelect(index);
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleCardClick = () => {
    if (!isEditing && onCardClick) {
      onCardClick(index);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedFront(proposal.front);
    setEditedBack(proposal.back);
    setEditedSubject(proposal.subject || "");
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedFront.trim() && editedBack.trim()) {
      updateProposal(index, {
        front: editedFront.trim(),
        back: editedBack.trim(),
        subject: editedSubject.trim() || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedFront(proposal.front);
    setEditedBack(proposal.back);
    setEditedSubject(proposal.subject || "");
  };

  return (
    <Card
      className={`group relative transition-all duration-200 hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""} ${!isEditing ? "cursor-pointer" : ""}`}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={handleToggleSelect} className="bg-background border-2" />
      </div>

      {/* Action buttons */}
      {!isEditing ? (
        <>
          {/* Edit button */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={handleEdit}
              title="Edytuj fiszkę"
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
        </>
      ) : (
        <>
          {/* Save button */}
          <div className="absolute top-3 right-12 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background text-green-600 hover:text-green-700"
              onClick={handleSaveEdit}
              title="Zapisz zmiany"
              disabled={!editedFront.trim() || !editedBack.trim()}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>

          {/* Cancel button */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
              onClick={handleCancelEdit}
              title="Anuluj"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Card content with flip animation or edit mode */}
      <CardContent className="p-6 pt-12 pb-12 min-h-[160px]">
        {!isEditing ? (
          <div className="relative h-full" onClick={(e) => e.stopPropagation()}>
            {/* Front side */}
            <div
              className={`transition-opacity duration-300 ${isFlipped ? "opacity-0 absolute inset-0" : "opacity-100"}`}
            >
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Przód</div>
                <div className="text-sm leading-relaxed line-clamp-3">{proposal.front}</div>
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
                <div className="text-sm leading-relaxed line-clamp-3">{proposal.back}</div>
                {proposal.source && (
                  <div className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                    {proposal.source === "ai-full" ? "Wygenerowane przez AI" : proposal.source}
                  </div>
                )}
              </div>
            </div>

            {/* Click hint */}
            <div className="absolute bottom-0 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Kliknij aby zobaczyć pełną fiszkę
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Edit form */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Przód</label>
              <Textarea
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                placeholder="Pytanie lub hasło"
                className="min-h-[60px] text-sm"
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground text-right">{editedFront.length}/120</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tył</label>
              <Textarea
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                placeholder="Odpowiedź lub wyjaśnienie"
                className="min-h-[80px] text-sm"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{editedBack.length}/300</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Temat (opcjonalny)
              </label>
              <Input
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="np. Historia, Matematyka"
                className="text-sm"
                maxLength={30}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
