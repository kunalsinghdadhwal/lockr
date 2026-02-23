import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function upgradeTier(userId: string) {
  const [existing] = await db
    .select({ tier: user.tier })
    .from(user)
    .where(eq(user.id, userId));

  if (!existing) {
    throw new Error("User not found");
  }

  if (existing.tier === "premium") {
    throw new Error("User is already on the premium tier");
  }

  await db
    .update(user)
    .set({ tier: "premium" })
    .where(eq(user.id, userId));
}

export async function getUserTier(userId: string) {
  const [row] = await db
    .select({ tier: user.tier })
    .from(user)
    .where(eq(user.id, userId));

  if (!row) {
    throw new Error("User not found");
  }

  return row.tier;
}
