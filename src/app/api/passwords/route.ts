import { NextRequest, NextResponse } from "next/server";
import { passwords } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }
  try {
    const allPasswords = await db
      .select()
      .from(passwords)
      .where(eq(passwords.userId, user_id));

    if (allPasswords.length === 0) {
      return NextResponse.json(
        { error: "No passwords found" },
        { status: 404 }
      );
    }
    return NextResponse.json(allPasswords, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
