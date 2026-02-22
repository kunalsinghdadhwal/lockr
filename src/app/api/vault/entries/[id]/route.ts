import { auth } from "@/lib/auth";
import { updateEntrySchema } from "@/lib/zod";
import { updateEntry, deleteEntry } from "@/services/vault.service";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateEntrySchema.parse(body);
    await updateEntry(userId, id, data.encrypted_blob);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Entry not found") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  try {
    await deleteEntry(userId, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Entry not found") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
