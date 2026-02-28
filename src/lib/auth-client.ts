import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, twoFactorClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [adminClient(), emailOTPClient(), twoFactorClient(), polarClient()],
});
