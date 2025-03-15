import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { appName, username, password, url, categroy } = await req.json();
  if (!appName || !username || !password || !url || !categroy) {
    return new Response("Missing required fields", { status: 400 });
  }
}
