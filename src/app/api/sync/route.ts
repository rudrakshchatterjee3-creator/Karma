import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { KVNamespace } from "@cloudflare/workers-types";

export const runtime = "edge";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Next.js edge runtime / Cloudflare exposes bindings on process.env
  const kv = process.env.KARMA_DATA as unknown as KVNamespace;
  if (!kv) {
    return NextResponse.json({ error: "KV Not configured" }, { status: 503 });
  }

  const key = `user:${session.user.email}`;
  try {
    const data = await kv.get(key, "json");
    return NextResponse.json(data || {});
  } catch (err: any) {
    return NextResponse.json({ error: "KV GET Failed", details: err.message, stack: err.stack, type: typeof kv, keys: Object.keys(kv || {}) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const kv = process.env.KARMA_DATA as unknown as KVNamespace;
  if (!kv) {
    return NextResponse.json({ error: "KV Not configured" }, { status: 503 });
  }

  const key = `user:${session.user.email}`;
  try {
    await kv.put(key, JSON.stringify(body));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "KV PUT Failed", details: err.message, stack: err.stack, type: typeof kv, keys: Object.keys(kv || {}) }, { status: 500 });
  }
}
