import { auth } from "@/lib/auth";
import { createEntrySchema } from "@/lib/zod";
import { getEntries, createEntry } from "@/services/vault.service";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const entries = await getEntries(userId);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const data = createEntrySchema.parse(body);
    const result = await createEntry(userId, data.encrypted_blob);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Entry limit reached") {
      return NextResponse.json(
        { error: "Entry limit reached" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
