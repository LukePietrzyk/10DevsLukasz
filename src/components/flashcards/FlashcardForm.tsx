import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FlashcardEntity, ApiErrorResponse, CreateFlashcardDto, UpdateFlashcardDto } from "@/types";
import { useFlashcardMutations } from "@/components/hooks/useFlashcardMutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Schema for form validation (simplified - front and back are required, subject is optional)
const flashcardFormSchema = z.object({
  front: z.string().min(1, "Front text is required").max(2000, "Front text cannot exceed 2000 characters").trim(),
  back: z.string().min(1, "Back text is required").max(2000, "Back text cannot exceed 2000 characters").trim(),
  subject: z.string().max(100, "Subject cannot exceed 100 characters").trim().optional().or(z.literal("")),
});

type FlashcardFormValues = z.infer<typeof flashcardFormSchema>;

interface FlashcardFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  flashcardId?: string;
  onSuccess: (flashcard: FlashcardEntity, addAnother?: boolean) => void;
  onError: (error: ApiErrorResponse) => void;
}

export function FlashcardForm({ isOpen, onClose, mode, flashcardId, onSuccess, onError }: FlashcardFormProps) {
  const [isLoadingFlashcard, setIsLoadingFlashcard] = useState(false);
  const [addAnother, setAddAnother] = useState(false);
  const { createMutation, updateMutation } = useFlashcardMutations();

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardFormSchema),
    defaultValues: {
      front: "",
      back: "",
      subject: "",
    },
  });

  // Load flashcard data when in edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && flashcardId) {
      setIsLoadingFlashcard(true);
      fetch(`/api/flashcards/${flashcardId}`)
        .then(async (res) => {
          if (!res.ok) {
            // Try to parse error response
            let errorDetail = "Failed to fetch flashcard";
            try {
              const errorData = await res.json();
              errorDetail = errorData.detail || errorDetail;
            } catch {
              // Ignore JSON parse errors
            }
            throw new Error(errorDetail);
          }
          return res.json();
        })
        .then((data: FlashcardEntity) => {
          form.reset({
            front: data.front,
            back: data.back,
            subject: data.subject || "",
          });
        })
        .catch((error) => {
          console.error("Error loading flashcard:", error);
          const status = error.message.includes("not found") ? 404 : 500;
          onError({
            type: "fetch_error",
            title: "Error Loading Flashcard",
            status,
            detail: error.message || "Failed to load flashcard data",
            instance: `/api/flashcards/${flashcardId}`,
          });
          // Close the modal on error
          onClose();
        })
        .finally(() => {
          setIsLoadingFlashcard(false);
        });
    } else if (isOpen && mode === "create") {
      form.reset({
        front: "",
        back: "",
        subject: "",
      });
    }
  }, [isOpen, mode, flashcardId, form, onError, onClose]);

  const onSubmit = async (values: FlashcardFormValues) => {
    try {
      if (mode === "create") {
        const createData: CreateFlashcardDto = {
          front: values.front,
          back: values.back,
          subject: values.subject || undefined,
          source: "manual",
        };

        const newFlashcard = await createMutation.mutateAsync(createData);
        const shouldAddAnother = addAnother; // Save the flag value before any changes
        onSuccess(newFlashcard, shouldAddAnother);

        if (shouldAddAnother) {
          // Reset form but keep modal open
          form.reset({
            front: "",
            back: "",
            subject: "",
          });
          // Reset the flag AFTER form reset (but before focus)
          setAddAnother(false);
          // Focus on front field
          setTimeout(() => {
            const frontInput = document.querySelector<HTMLInputElement>('input[name="front"]');
            frontInput?.focus();
          }, 100);
        } else {
          onClose();
        }
      } else {
        // Edit mode
        if (!flashcardId) {
          onError({
            type: "validation_error",
            title: "Validation Error",
            status: 400,
            detail: "Flashcard ID is required for edit mode",
            instance: "/api/flashcards",
          });
          return;
        }

        const updateData: UpdateFlashcardDto = {
          front: values.front,
          back: values.back,
          subject: values.subject || undefined,
        };

        const updatedFlashcard = await updateMutation.mutateAsync({ id: flashcardId, data: updateData });
        onSuccess(updatedFlashcard);
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const apiError = error as ApiErrorResponse;
      onError(apiError);
      // Reset flag on error
      setAddAnother(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      if (mode === "create") {
        e.preventDefault();
        setAddAnother(true);
        form.handleSubmit(onSubmit)();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Dodaj fiszkę" : "Edytuj fiszkę"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Wypełnij formularz, aby dodać nową fiszkę" : "Wprowadź zmiany w fiszce"}
          </DialogDescription>
        </DialogHeader>

        {isLoadingFlashcard ? (
          <div className="py-8 text-center text-muted-foreground">Ładowanie danych...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="front"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Front (Pytanie)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Wprowadź pytanie..."
                        maxLength={2000}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="back"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Back (Odpowiedź)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Wprowadź odpowiedź..."
                        maxLength={2000}
                        rows={4}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Opcjonalny)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Np. JavaScript, Matematyka..."
                        maxLength={100}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Anuluj
                </Button>
                {mode === "create" && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAddAnother(true);
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Zapisz i dodaj kolejną
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  onClick={() => {
                    // Ensure addAnother is false for regular submit
                    if (mode === "create") {
                      setAddAnother(false);
                    }
                  }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Zapisywanie..."
                    : mode === "create"
                      ? "Zapisz"
                      : "Zapisz zmiany"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
