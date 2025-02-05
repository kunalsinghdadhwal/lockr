import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        try {
          const user = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.email, credentials.identifier),
                eq(users.username, credentials.identifier)
              )
            )
            .limit(1);
          if (!user) {
            throw new Error("Invalid credentials");
          }

          if (!user[0].isVerified) {
            throw new Error("Please verify your Account First");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user[0].password
          );

          if (isValid) {
            return user;
          } else {
            throw new Error("Invalid password");
          }
        } catch (error: any) {
          throw new Error(error);
        }
      },
    }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token._id = user.;
            }
            return token;
        },
        async session({ session, token }) {
            return session;
        },
    }
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
    secret: process.env.NEXTAUTH_SECRET,
  adapter:DrizzleAdapter(db), 
};
