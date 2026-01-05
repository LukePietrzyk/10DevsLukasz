import React, { useState } from "react";
import { useGenerateStore } from "@/lib/stores/generate.store";
import ProposalList from "./ProposalList";
import SaveSelectedBar from "./SaveSelectedBar";
import FlashcardPreview from "./FlashcardPreview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ProposalsPanel: React.FC = () => {
  const { proposals, loading } = useGenerateStore();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleOpenPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const handleClosePreview = () => {
    setPreviewIndex(null);
  };

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Generowanie propozycji...</CardTitle>
          <CardDescription>AI analizuje materiał i tworzy fiszki</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground">Przetwarzam materiał źródłowy...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Propozycje fiszek</CardTitle>
          <CardDescription>Tutaj pojawią się wygenerowane fiszki do przejrzenia i zaakceptowania</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="text-4xl">📚</div>
              <p className="text-muted-foreground">Wprowadź materiał źródłowy i kliknij "Generuj fiszki"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Propozycje fiszek ({proposals.length})</CardTitle>
            <CardDescription>Przejrzyj wygenerowane fiszki i wybierz te, które chcesz zapisać</CardDescription>
          </CardHeader>
          <CardContent>
            <ProposalList onCardClick={handleOpenPreview} />
          </CardContent>
        </Card>

        <SaveSelectedBar />
      </div>

      {/* Flashcard Preview Modal */}
      {previewIndex !== null && (
        <FlashcardPreview
          proposals={proposals}
          currentIndex={previewIndex}
          isOpen={previewIndex !== null}
          onClose={handleClosePreview}
          onNavigate={setPreviewIndex}
        />
      )}
    </>
  );
};

export default ProposalsPanel;
