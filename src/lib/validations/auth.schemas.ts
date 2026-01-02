import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Hasła muszą być identyczne",
    path: ["confirm"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Hasła muszą być identyczne",
    path: ["confirm"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
    newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: "Hasła muszą być identyczne",
    path: ["confirm"],
  });
