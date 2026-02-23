import { auth } from "@/lib/auth";
import { updateEntrySchema } from "@/lib/zod";
import { updateEntry, deleteEntry } from "@/services/vault.service";
import { ZodError } from "zod";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    const body = await request.json();
    const data = updateEntrySchema.parse(body);
    await updateEntry(userId, id, data.encrypted_blob);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return Response.json({ error: e.issues }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Entry not found") {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "User not found") {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    await deleteEntry(userId, id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Entry not found") {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "User not found") {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
