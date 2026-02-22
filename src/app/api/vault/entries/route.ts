import { auth } from "@/lib/auth";
import { createEntrySchema } from "@/lib/zod";
import { getEntries, createEntry } from "@/services/vault.service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const entries = await getEntries(userId);
    return Response.json({ entries });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const data = createEntrySchema.parse(body);
    const result = await createEntry(userId, data.encrypted_blob);
    return Response.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return Response.json({ error: e.errors }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Entry limit reached") {
      return Response.json(
        { error: "Entry limit reached" },
        { status: 403 }
      );
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
