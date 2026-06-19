import { handlers } from "@/auth";

export const runtime = "edge";

// Safe Edge-compatible fetch interceptor to bypass Google User-Agent blocking on Cloudflare
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: any, init?: any) => {
  if (input instanceof Request) {
    // Edge runtime forbids passing 'headers' in init if input is a Request.
    // We must safely clone the request and modify the headers.
    const newReq = new Request(input, init);
    newReq.headers.set("User-Agent", "KarmaApp/1.0.0 (Cloudflare Pages)");
    return originalFetch(newReq);
  } else {
    const customInit = init || {};
    customInit.headers = new Headers(customInit.headers);
    customInit.headers.set("User-Agent", "KarmaApp/1.0.0 (Cloudflare Pages)");
    return originalFetch(input, customInit);
  }
};

export const { GET, POST } = handlers;
