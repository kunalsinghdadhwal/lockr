import { auth } from "@/lib/auth";
import { upgradeVaultSchema } from "@/lib/zod";
import { upgradeVault } from "@/services/vault.service";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const data = upgradeVaultSchema.parse(body);

    await upgradeVault(userId, data);

    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return Response.json({ error: e.issues }, { status: 400 });
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
