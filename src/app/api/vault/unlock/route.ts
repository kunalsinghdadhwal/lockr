import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVaultMetadata } from "@/services/vault.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const metadata = await getVaultMetadata(userId);
    if (!metadata) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
