import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { vaultSetupSchema } from "@/lib/zod";
import { initializeVault } from "@/services/vault.service";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const data = vaultSetupSchema.parse(body);

    await initializeVault(userId, data);

    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return Response.json({ error: e.errors }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Vault already initialized") {
      return Response.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof Error && e.message === "User not found") {
      return Response.json({ error: e.message }, { status: 404 });
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
