import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, CheckCircle2 } from "lucide-react";
import { useGenerateStore } from "@/lib/stores/generate.store";

const SaveSelectedBar: React.FC = () => {
  const { proposals, selectedIds, loading, error, saveSelected, clearError } = useGenerateStore();

  const selectedCount = selectedIds.size;
  const totalCount = proposals.length;

  // Don't show the bar if there are no proposals
  if (totalCount === 0) {
    return null;
  }

  const handleSave = async () => {
    if (selectedCount === 0) {
      return;
    }

    clearError();
    await saveSelected();
  };

  return (
    <div className="sticky bottom-4 z-20">
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Selection counter */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {selectedCount > 0 ? (
                    <>
                      Zapiszesz <span className="font-bold text-primary">{selectedCount}</span> z {totalCount} kart
                    </>
                  ) : (
                    <>Wybierz karty do zapisania ({totalCount} dostępnych)</>
                  )}
                </p>
                {selectedCount > 0 && (
                  <p className="text-xs text-muted-foreground">Karty zostaną dodane do Twojej kolekcji fiszek</p>
                )}
              </div>
            </div>

            {/* Save button */}
            <Button onClick={handleSave} disabled={selectedCount === 0 || loading} size="lg" className="min-w-[120px]">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Zapisuję...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz wybrane
                </>
              )}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaveSelectedBar;
