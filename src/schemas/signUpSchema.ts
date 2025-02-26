import { z } from "zod";

export const emailValidation = z.string().email({
  message: "Invalid email address",
});

export const passwordValidation = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" });

export const signUpSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});
