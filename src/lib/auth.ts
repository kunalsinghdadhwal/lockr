import { db } from "@/db/drizzle";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import * as schema from "@/db/schema";

function extractResetToken(url: string): string | null {
  const match = url.match(/reset-password\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [openAPI()],
  user: {
    additionalFields: {
      iv: {
        type: "string",
        required: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const token = extractResetToken(url);
      await sendVerificationEmail(
        user.email,
        user.name,
        token!,
        "Sigma Boyz Reset Password",
        "Click the link below to reset your password",
        "Reset Password",
        "/reset-password",
        false
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      await sendVerificationEmail(
        user.email,
        user.name,
        token,
        "Sigma Boyz verification Code",
        "Thank you for registering. Please use the following verification code to complete your registration",
        "Verify Here",
        process.env.EMAIL_VERIFICATION_CALLBACK_URL!,
        true
      );
    },
  },
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
