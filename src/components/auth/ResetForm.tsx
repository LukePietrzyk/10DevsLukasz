import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthStore } from "@/lib/stores/auth.store";
import { resetPasswordSchema } from "@/lib/validations/auth.schemas";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { supabaseClient } from "@/db/supabase.client";

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetForm() {
  const { updatePassword, loading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });

  React.useEffect(() => {
    // Check if there's a recovery token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (!accessToken || type !== "recovery") {
      setTokenError("Link jest nieprawidłowy lub wygasł. Poproś o nowy link resetujący hasło.");
      return;
    }

    // Supabase will automatically handle the token from the hash fragment
    // Verify the session with Supabase
    supabaseClient.auth
      .getSession()
      .then(({ data, error }: { data: { session: unknown }; error: unknown }) => {
        if (error || !data.session) {
          setTokenError("Link jest nieprawidłowy lub wygasł. Poproś o nowy link resetujący hasło.");
        }
      })
      .catch(() => {
        setTokenError("Link jest nieprawidłowy lub wygasł. Poproś o nowy link resetujący hasło.");
      });
  }, []);

  const onSubmit = async (values: ResetFormValues) => {
    clearError();
    setTokenError(null);
    try {
      await updatePassword(values.password);
    } catch {
      // Error is handled by the store
    }
  };

  if (tokenError) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Błąd</CardTitle>
          <CardDescription className="text-center">{tokenError}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            <a href="/auth/forgot" className="text-primary hover:underline">
              Poproś o nowy link
            </a>
          </div>
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
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Ustaw nowe hasło</CardTitle>
        <CardDescription className="text-center">Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nowe hasło</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Wprowadź nowe hasło"
                        {...field}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Potwierdź nowe hasło"
                        {...field}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirm(!showConfirm)}
                        disabled={loading}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ustaw nowe hasło
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
