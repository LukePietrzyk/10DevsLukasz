import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthStore } from "@/lib/stores/auth.store";
import { loginSchema } from "@/lib/validations/auth.schemas";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login, loading, error, clearError } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    clearError();
    try {
      await login(values.email, values.password);
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Zaloguj się</CardTitle>
        <CardDescription className="text-center">Wprowadź swoje dane, aby zalogować się do konta</CardDescription>
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Wprowadź hasło" {...field} disabled={loading} />
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
              Zaloguj się
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          <a href="/auth/forgot" className="text-primary hover:underline">
            Zapomniałem hasła
          </a>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Nie masz konta?{" "}
          <a href="/auth/register" className="text-primary hover:underline">
            Zarejestruj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
