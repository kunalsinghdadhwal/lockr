import { auth } from "@/lib/auth";
import { getVaultMetadata } from "@/services/vault.service";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const metadata = await getVaultMetadata(userId);
    if (!metadata) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(metadata);
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
