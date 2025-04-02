import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { passwords } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await db.insert(passwords).values({
      userId: body.userId,
      username: body.username,
      password: body.password,
      serviceName: body.category,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error inserting password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save entry" },
      { status: 500 }
    );
  }
}
