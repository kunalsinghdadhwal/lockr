import { NextRequest, NextResponse } from "next/server";
import { passwords, masterPasswords } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { ctx } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, key } = await req.json();
  try {
    const masterPasswordHash = await db
      .select({ password: masterPasswords.password })
      .from(masterPasswords)
      .where(eq(masterPasswords.email, email));

    const isCorrectKey = await ctx.password.verify({
      password: key,
      hash: masterPasswordHash[0].password,
    });

    if (!isCorrectKey) {
      return NextResponse.json({ error: "Invalid key" }, { status: 401 });
    }

    const allPasswords = await db
      .select({ password: passwords.password })
      .from(passwords)
      .where(eq(passwords.email, email));
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
