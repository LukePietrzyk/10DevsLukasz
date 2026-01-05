import { create } from "zustand";
import type {
  GenerateRequestDto,
  FlashcardProposalDto,
  BatchCreateFlashcardsDto,
  BatchCreateResponse,
  CreateFlashcardDto,
} from "@/types";

interface GenerateState {
  loading: boolean;
  proposals: FlashcardProposalDto[];
  selectedIds: Set<number>; // indeksy tabeli proposals
  error: string | null;

  // Actions
  generate: (req: GenerateRequestDto) => Promise<void>;
  toggleSelect: (id: number) => void;
  updateProposal: (index: number, updates: Partial<FlashcardProposalDto>) => void;
  saveSelected: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export const useGenerateStore = create<GenerateState>((set, get) => ({
  loading: false,
  proposals: [],
  selectedIds: new Set(),
  error: null,

  generate: async (req: GenerateRequestDto) => {
    set({ loading: true, error: null });

    try {
      // Walidacja po stronie klienta
      if (!req.sourceText || req.sourceText.length < 20) {
        throw new Error("Materiał źródłowy musi mieć co najmniej 20 znaków");
      }

      if (req.sourceText.length > 5000) {
        throw new Error("Materiał źródłowy nie może przekraczać 5000 znaków");
      }

      if (req.max < 1 || req.max > 20) {
        throw new Error("Liczba kart musi być między 1 a 20");
      }

      if (req.subject && req.subject.length > 30) {
        throw new Error("Temat nie może przekraczać 30 znaków");
      }

      // Placeholder API call - w Phase 2 zostanie zastąpione prawdziwym API
      // Na razie generujemy mock data
      const mockProposals: FlashcardProposalDto[] = Array.from({ length: Math.min(req.max, 5) }, (_, i) => ({
        front: `Pytanie ${i + 1} z materiału: ${req.sourceText.substring(0, 30)}...`,
        back: `Odpowiedź ${i + 1} - szczegółowe wyjaśnienie tematu`,
        subject: req.subject || "Wygenerowane",
        source: "ai-full" as const,
        generationId: `gen_${Date.now()}_${i}`,
      }));

      // Symulacja opóźnienia API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      set({
        proposals: mockProposals,
        selectedIds: new Set(), // Reset selection
        loading: false,
      });

      // W prawdziwej implementacji:
      // const response = await fetch('/api/flashcards/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(req)
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.detail || 'Błąd podczas generowania');
      // }
      //
      // const data: GenerateResponseDto = await response.json();
      // set({ proposals: data.proposals, selectedIds: new Set(), loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      set({ error: message, loading: false });
    }
  },

  toggleSelect: (id: number) => {
    const { selectedIds } = get();
    const newSelectedIds = new Set(selectedIds);

    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }

    set({ selectedIds: newSelectedIds });
  },

  updateProposal: (index: number, updates: Partial<FlashcardProposalDto>) => {
    const { proposals } = get();
    const newProposals = [...proposals];

    if (index >= 0 && index < newProposals.length) {
      newProposals[index] = {
        ...newProposals[index],
        ...updates,
      };
      set({ proposals: newProposals });
    }
  },

  saveSelected: async () => {
    const { proposals, selectedIds } = get();

    if (selectedIds.size === 0) {
      set({ error: "Wybierz co najmniej jedną fiszkę do zapisania" });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Przygotowanie danych do zapisu
      const selectedProposals = Array.from(selectedIds).map((id) => proposals[id]);
      const flashcardsToCreate: CreateFlashcardDto[] = selectedProposals.map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        subject: proposal.subject,
        source: proposal.source || "ai-full",
        generationId: proposal.generationId || undefined,
      }));

      const batchRequest: BatchCreateFlashcardsDto = {
        flashcards: flashcardsToCreate,
      };

      const response = await fetch("/api/flashcards/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Błąd podczas zapisywania fiszek");
      }

      await response.json();

      // Reset stanu po sukcesie
      set({
        proposals: [],
        selectedIds: new Set(),
        loading: false,
      });

      // Redirect do listy fiszek
      window.location.href = "/flashcards";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      set({ error: message, loading: false });
    }
  },

  reset: () => {
    set({
      loading: false,
      proposals: [],
      selectedIds: new Set(),
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
