import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { FlashcardEntity } from "@/types";

interface FlashcardStudyModalProps {
  flashcards: FlashcardEntity[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const FlashcardStudyModal: React.FC<FlashcardStudyModalProps> = ({
  flashcards,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const currentCard = flashcards[currentIndex];

  // Reset flip state when navigating to a new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Reset flip state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsFlipped(false);
    }
  }, [isOpen]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, flashcards.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          handleFlip();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, currentIndex, isFlipped, handlePrevious, handleNext, handleFlip, onClose]);

  if (!currentCard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 bg-transparent border-none shadow-none" showCloseButton={false}>
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-background/80 hover:bg-background z-50"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Navigation buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-50">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-background/80 hover:bg-background pointer-events-auto -ml-16"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-background/80 hover:bg-background pointer-events-auto -mr-16"
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Card counter */}
          <div className="absolute -top-12 left-0 text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
            {currentIndex + 1} / {flashcards.length}
          </div>

          {/* Flashcard with 3D flip animation */}
          <div className="perspective-1000">
            <div
              className={`relative w-full h-[500px] transition-transform duration-500 transform-style-3d cursor-pointer ${
                isFlipped ? "rotate-y-180" : ""
              }`}
              onClick={handleFlip}
            >
              {/* Front side */}
              <div
                className={`absolute inset-0 backface-hidden bg-card rounded-lg border-2 shadow-2xl p-8 flex flex-col justify-center items-center ${
                  isFlipped ? "invisible" : ""
                }`}
              >
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide rounded-full">
                      Przód
                    </span>
                  </div>
                  <div className="text-center text-2xl font-medium leading-relaxed px-4">{currentCard.front}</div>
                  {currentCard.subject && (
                    <div className="text-center">
                      <span className="inline-block px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-md">
                        {currentCard.subject}
                      </span>
                    </div>
                  )}
                  <div className="text-center text-sm text-muted-foreground pt-8">Kliknij aby obrócić</div>
                </div>
              </div>

              {/* Back side */}
              <div
                className={`absolute inset-0 backface-hidden bg-card rounded-lg border-2 shadow-2xl p-8 flex flex-col justify-center items-center rotate-y-180 ${
                  !isFlipped ? "invisible" : ""
                }`}
              >
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide rounded-full">
                      Tył
                    </span>
                  </div>
                  <div className="text-center text-xl leading-relaxed px-4">{currentCard.back}</div>
                  {currentCard.source && (
                    <div className="text-center">
                      <span className="inline-block px-4 py-2 bg-muted text-muted-foreground text-sm rounded-md">
                        {currentCard.source === "ai-full"
                          ? "Wygenerowane przez AI"
                          : currentCard.source === "ai-edited"
                            ? "Edytowane AI"
                            : "Ręczne"}
                      </span>
                    </div>
                  )}
                  <div className="text-center text-sm text-muted-foreground pt-8">Kliknij aby obrócić z powrotem</div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-4 py-2 rounded-full whitespace-nowrap">
            <span className="opacity-75">← → Nawigacja • Spacja/Enter Obrót • Esc Zamknij</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardStudyModal;
