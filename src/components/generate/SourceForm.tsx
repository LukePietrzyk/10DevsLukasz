import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateStore } from "@/lib/stores/generate.store";
import type { GenerateRequestDto } from "@/types";

// Schemat walidacji zgodny z planem
const generateSchema = z.object({
  sourceText: z
    .string()
    .min(20, "Materiał źródłowy musi mieć co najmniej 20 znaków")
    .max(5000, "Materiał źródłowy nie może przekraczać 5000 znaków"),
  max: z.number().min(1, "Minimalna liczba kart to 1").max(20, "Maksymalna liczba kart to 20"),
  subject: z.string().max(30, "Temat nie może przekraczać 30 znaków").optional(),
});

type GenerateFormData = z.infer<typeof generateSchema>;

const SourceForm: React.FC = () => {
  const { generate, loading, error, clearError } = useGenerateStore();

  const form = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      sourceText: "",
      max: 5,
      subject: "",
    },
  });

  const onSubmit = async (data: GenerateFormData) => {
    clearError();

    const request: GenerateRequestDto = {
      sourceText: data.sourceText,
      max: data.max,
      subject: data.subject || undefined,
    };

    await generate(request);
  };

  const sourceTextValue = form.watch("sourceText");
  const isFormValid = sourceTextValue.length >= 20;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Materiał źródłowy</CardTitle>
        <CardDescription>Wklej tekst, notatki lub prompt, z którego AI wygeneruje fiszki</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Textarea dla materiału źródłowego */}
            <FormField
              control={form.control}
              name="sourceText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tekst źródłowy</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wklej tutaj materiał do nauki, notatki, artykuł lub napisz prompt opisujący czego chcesz się nauczyć..."
                      className="min-h-[200px] resize-none"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{sourceTextValue.length}/5000 znaków (min. 20)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opcje generowania */}
            <div className="grid grid-cols-1 gap-4">
              {/* Liczba kart */}
              <FormField
                control={form.control}
                name="max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liczba kart</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        disabled={loading}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>Maksymalna liczba fiszek do wygenerowania (1-20)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temat (opcjonalny) */}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temat (opcjonalny)</FormLabel>
                    <FormControl>
                      <Input placeholder="np. Historia, Matematyka, Programowanie..." disabled={loading} {...field} />
                    </FormControl>
                    <FormDescription>Pomoże AI lepiej dostosować pytania do dziedziny</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Komunikat błędu */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            {/* Przycisk generowania */}
            <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generuję fiszki...
                </>
              ) : (
                "Generuj fiszki"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SourceForm;
