import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FlashcardEntity, ApiErrorResponse, CreateFlashcardDto, UpdateFlashcardDto } from "@/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlashcard, setIsLoadingFlashcard] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

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
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch flashcard");
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
          onError({
            type: "fetch_error",
            title: "Error Loading Flashcard",
            status: 500,
            detail: "Failed to load flashcard data",
            instance: `/api/flashcards/${flashcardId}`,
          });
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
  }, [isOpen, mode, flashcardId, form, onError]);

  const onSubmit = async (values: FlashcardFormValues) => {
    setIsLoading(true);

    try {
      if (mode === "create") {
        const createData: CreateFlashcardDto = {
          front: values.front,
          back: values.back,
          subject: values.subject || undefined,
          source: "manual",
        };

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          const error: ApiErrorResponse = await response.json();
          onError(error);
          setIsLoading(false);
          return;
        }

        const newFlashcard: FlashcardEntity = await response.json();
        onSuccess(newFlashcard, addAnother);

        if (addAnother) {
          form.reset({
            front: "",
            back: "",
            subject: "",
          });
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
          setIsLoading(false);
          return;
        }

        const updateData: UpdateFlashcardDto = {
          front: values.front,
          back: values.back,
          subject: values.subject || undefined,
        };

        const response = await fetch(`/api/flashcards/${flashcardId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error: ApiErrorResponse = await response.json();
          onError(error);
          setIsLoading(false);
          return;
        }

        const updatedFlashcard: FlashcardEntity = await response.json();
        onSuccess(updatedFlashcard);
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      onError({
        type: "network_error",
        title: "Network Error",
        status: 500,
        detail: "An unexpected error occurred",
        instance: mode === "create" ? "/api/flashcards" : `/api/flashcards/${flashcardId}`,
      });
    } finally {
      setIsLoading(false);
      setAddAnother(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      if (mode === "create") {
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
                      <Input {...field} placeholder="Wprowadź pytanie..." maxLength={2000} disabled={isLoading} />
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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
                    disabled={isLoading}
                  >
                    Zapisz i dodaj kolejną
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Zapisywanie..." : mode === "create" ? "Zapisz" : "Zapisz zmiany"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
