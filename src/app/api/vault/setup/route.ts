import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { vaultSetupSchema } from "@/lib/zod";
import { initializeVault } from "@/services/vault.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const data = vaultSetupSchema.parse(body);

    await initializeVault(userId, data);

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Vault already initialized") {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
