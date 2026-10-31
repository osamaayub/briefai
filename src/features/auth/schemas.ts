import { z } from "zod";

// Normalise first, then validate, so " Osama@Example.com " is accepted.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
