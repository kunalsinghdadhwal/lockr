import { z } from "zod";

export const usernameValidation = z
  .string()
  .min(2, "Username must be at least 2 characters long")
  .max(32, "Username must be at most 32 characters long")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username must only contain letters, numbers, and underscores"
  );

export const emailValidation = z.string().email({
  message: "Invalid email address",
});

export const passwordValidation = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" });

export const signUpSchema = z.object({
  username: usernameValidation,
  email: emailValidation,
  password: passwordValidation,
});
