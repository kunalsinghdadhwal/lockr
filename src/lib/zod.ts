import { object, string, z } from "zod";

const getPasswordSchema = (type: "password" | "confirmPassword") =>
  string({ required_error: `${type} is required` }).min(
    8,
    `${type} must be atleast 8 characters`
  );

const getEmailSchema = () =>
  string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email");

const getNameSchema = () =>
  string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters");

export const signUpSchema = object({
  name: getNameSchema(),
  email: getEmailSchema(),
  password: getPasswordSchema("password"),
  confirmPassword: getPasswordSchema("confirmPassword"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = object({
  email: getEmailSchema(),
  password: getPasswordSchema("password"),
});

export const forgotPasswordSchema = object({
  email: getEmailSchema(),
});

export const resetPasswordSchema = object({
  password: getPasswordSchema("password"),
  confirmPassword: getPasswordSchema("confirmPassword"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// --- Vault schemas ---

export const kdfParamsSchema = z.object({
  algo: z.enum(["pbkdf2", "argon2id"]),
  iterations: z.number().int().positive().optional(),
  memory: z.number().int().positive().optional(),
  parallelism: z.number().int().positive().optional(),
});

export const vaultSetupSchema = z.object({
  vault_salt: z.string().min(1),
  encrypted_vault_key: z.string().min(1),
  auth_key_hash: z.string().length(64),
  kdf_params: kdfParamsSchema,
});

export const createEntrySchema = z.object({
  encrypted_blob: z.string().min(1),
});

export const updateEntrySchema = z.object({
  encrypted_blob: z.string().min(1),
});

export const rotateKeySchema = z.object({
  vault_salt: z.string().min(1),
  encrypted_vault_key: z.string().min(1),
  auth_key_hash: z.string().length(64),
  kdf_params: kdfParamsSchema,
});

export const upgradeVaultSchema = z.object({
  encrypted_vault_key: z.string().min(1),
  recovery_vault_key: z.string().optional(),
  auth_key_hash: z.string().length(64),
  kdf_params: kdfParamsSchema,
});
