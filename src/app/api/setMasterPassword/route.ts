import { db } from "@/db/drizzle";
import { NextRequest, NextResponse } from "next/server";
import { masterPasswords } from "@/db/schema";
import { ctx } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, key } = await req.json();
  const hashedKey = await ctx.password.hash(key);

  try {
    await db.insert(masterPasswords).values({
      email,
      password: hashedKey,
    });
    return NextResponse.json({ message: "Success", status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error", status: 500 });
  }
}
