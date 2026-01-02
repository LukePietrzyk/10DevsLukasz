import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthStore } from "@/lib/stores/auth.store";
import { forgotPasswordSchema } from "@/lib/validations/auth.schemas";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotForm() {
  const { resetPassword, loading, error, clearError } = useAuthStore();
  const [success, setSuccess] = React.useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    clearError();
    setSuccess(false);
    try {
      await resetPassword(values.email);
      setSuccess(true);
    } catch {
      // Error is handled by the store
    }
  };

  if (success) {
    return (
      <Card className="w-full bg-white border-[#E2E8F0] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Link wysłany</CardTitle>
          <CardDescription className="text-center">
            Link do resetowania hasła został wysłany na Twój adres e-mail.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            <a href="/auth/login" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white border-[#E2E8F0] shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset hasła</CardTitle>
        <CardDescription className="text-center">
          Wprowadź swój adres e-mail, a wyślemy Ci link do resetowania hasła
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="twoj@email.com" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md bg-destructive/15 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij link resetujący
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          <a href="/auth/login" className="text-primary hover:underline">
            Powrót do logowania
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
