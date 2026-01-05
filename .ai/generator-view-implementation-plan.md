# Plan implementacji widoku „Generowanie fiszek”

## 1. Przegląd

Widok umożliwia użytkownikowi wygenerowanie propozycji fiszek przez AI na podstawie wklejonego tekstu lub promptu. W MVP funkcja ta znajduje się **w fazie 2** – jednak przygotowujemy projekt UI, aby łatwo ją później aktywować (feature-flag). Ekran pozwoli wkleić materiał źródłowy, wysłać żądanie do backendu (`/api/flashcards/generate` – placeholder), przejrzeć listę wygenerowanych kart, zaakceptować wybrane oraz zapisać je batch-owo.

## 2. Routing widoku

| Ścieżka                | Widok                                    |
| ---------------------- | ---------------------------------------- |
| `/flashcards/generate` | Formularz generowania + lista propozycji |

## 3. Struktura komponentów

```
GenerateLayout (two-column)
 ├── SourceForm
 │     ├── TextareaInput (materiał źródłowy / prompt)
 │     ├── OptionsBar (język, max cards, subject)
 │     └── GenerateButton
 └── ProposalsPanel
       ├── ProposalList
       │     ├── ProposalCard * n
       │     │     ├── FrontBackPreview
       │     │     └── AcceptToggle
       └── SaveSelectedBar (X/Y zaznaczonych, SaveButton)
```

## 4. Szczegóły komponentów

### GenerateLayout

- **Opis:** Układ dzielący ekran na formularz (lewa kolumna, `md:1/3`) i panel propozycji (prawa, `md:2/3`).

### SourceForm

- **Opis:** Formularz przyjmujący materiał źródłowy.
- **Główne elementy:** `<Textarea>` (`rows=10`), `<Select>` subject, `<Input>` maxCards (1-20), `<Button>` „Generuj”.
- **Interakcje:** `onSubmit` → `POST /api/flashcards/generate`.
- **Walidacja:** źródło min 20 znaków, max 5000; maxCards 1-20; subject optional ≤30 znaków.
- **Typy:** `GenerateRequestDto { sourceText: string; max: number; subject?: string }`.

### ProposalList & ProposalCard

- **Opis:** Lista kart z checkboxem/ikoną akceptacji.
- **Elementy:** Front + Back preview (flip on hover), przycisk „Edytuj” (otworzy modal w Phase 2).
- **Walidacja:** — (readonly)
- **Typy:** `FlashcardProposalDto` (z `types.ts`).

### SaveSelectedBar

- **Opis:** Sticky bar poniżej listy z informacją `„Zapiszesz 3/12 kart”` + `SaveButton`.
- **Interakcje:** `onClick` → `POST /api/flashcards/batch` (zaznaczone).

## 5. Typy

```ts
export interface GenerateRequestDto {
  sourceText: string;
  max: number; // 1-20
  subject?: string;
}

// Odpowiedź generacji
export interface GenerateResponseDto {
  proposals: FlashcardProposalDto[]; // <= max
}
```

## 6. Zarządzanie stanem

`useGenerateStore` (Zustand):

```ts
interface GenerateState {
  loading: boolean;
  proposals: FlashcardProposalDto[];
  selectedIds: Set<number>; // indeksy tabeli proposals
  generate(req: GenerateRequestDto): Promise<void>;
  toggleSelect(id: number): void;
  saveSelected(): Promise<void>;
  reset(): void;
}
```

## 7. Integracja API

1. `POST /api/flashcards/generate` (Phase 2) → zwraca `GenerateResponseDto`.
2. `POST /api/flashcards/batch` – zapisywanie wybranych.
   - Request body: `{ flashcards: FlashcardProposalDto[] }`
   - Response: `BatchCreateResponse`.

## 8. Interakcje użytkownika

- Wklejenie tekstu → `GenerateButton` aktywny.
- Submit → spinner, disable inputs.
- Sukces → render `ProposalList`.
- Kliknięcie karty → toggle accept.
- `SaveSelectedButton` → zapisuje → toast success + redirect `/flashcards`.

## 9. Warunki i walidacja

- `sourceText` wymagany, >20 znaków.
- `max` 1-20.
- Nie można zapisać, jeśli `selectedIds.size === 0`.

## 10. Obsługa błędów

- 400/422 (walidacja) → wyświetlone przy polach.
- 500 → toast „Spróbuj ponownie”.
- 409 limit 2000 → modal z sugestią usunięcia starych kart.

## 11. Kroki implementacji

1. Utworzyć routing `/flashcards/generate` w Astro i osadzić `GenerateLayout`.
2. Dodać formularz z RHF + Zod (`GenerateRequestDto`).
3. Zaimplementować `useGenerateStore` z Supabase fetch (placeholder) + loading.
4. Stworzyć `ProposalCard` i `ProposalList` z responsywnością (grid `md:2`, `lg:3`).
5. Dodać `SaveSelectedBar` sticky z licznikiem.
6. Podłączyć `batch.ts` endpoint do zapisu.
7. Dodać toasty success/error.
8. Napisać testy jednostkowe store (toggle, batch body).
9. Test E2E: generate → select → save → redirect list.
