import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  // Safely grab process and env
  const pType = typeof process;
  const envKeys = pType !== "undefined" && process.env ? Object.keys(process.env) : [];
  
  const debugInfo = {
    processType: pType,
    hasProcessEnv: pType !== "undefined" && !!process.env,
    envKeysFound: envKeys,
    AUTH_URL: pType !== "undefined" ? process.env?.AUTH_URL : "missing",
    NEXTAUTH_URL: pType !== "undefined" ? process.env?.NEXTAUTH_URL : "missing",
    AUTH_SECRET_RAW: pType !== "undefined" ? String(process.env?.AUTH_SECRET) : "missing",
    AUTH_GOOGLE_ID_RAW: pType !== "undefined" ? String(process.env?.AUTH_GOOGLE_ID) : "missing",
    AUTH_GOOGLE_SECRET_RAW: pType !== "undefined" ? String(process.env?.AUTH_GOOGLE_SECRET) : "missing",
    edgeRuntime: pType !== "undefined" ? process.env?.NEXT_RUNTIME : "unknown",
    headers: Object.fromEntries(req.headers.entries()),
    url: req.url,
  };

  return NextResponse.json({
    status: "DIAGNOSTIC_ACTIVE",
    timestamp: new Date().toISOString(),
    debugInfo
  });
}
