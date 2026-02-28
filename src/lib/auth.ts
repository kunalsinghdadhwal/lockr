import { db } from "@/db/drizzle";
import { sendEmail } from "@/helpers/sendEmail";
import { getResend } from "@/lib/resend";
import OTPEmail from "../../emails/OTPEmail";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, emailOTP, twoFactor } from "better-auth/plugins";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import * as schema from "@/db/schema";
import { upgradeTier } from "@/services/payment.service";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

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
  plugins: [
    openAPI(),
    admin(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp, type }) {
        await getResend().emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject:
            type === "email-verification"
              ? "Lockr - Verify your email"
              : type === "sign-in"
                ? "Lockr - Sign-in code"
                : "Lockr - Reset your password",
          react: OTPEmail({ otp, type }),
        });
      },
    }),
    twoFactor({
      issuer: "Lockr",
      totpOptions: {
        digits: 6,
        period: 30,
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      use: [
        checkout({
          products: [
            { productId: process.env.POLAR_PREMIUM_PRODUCT_ID!, slug: "premium" },
          ],
          successUrl: "/dashboard?upgrade=success",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onOrderPaid: async (payload) => {
            const customerId = payload.data?.customer?.externalId;
            if (customerId) {
              await upgradeTier(customerId);
            }
          },
        }),
      ],
    }),
  ],
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, token }) => {
      await sendEmail(
        user.email,
        user.name,
        token,
        "Lockr Reset Password Link",
        "reset"
      );
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  advanced: {
    cookiePrefix: "lockr",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
