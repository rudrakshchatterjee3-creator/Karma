import { handlers } from "@/auth";

export const runtime = "edge";

// Cloudflare Workers fetch implementation often omits a default User-Agent.
// Google OAuth APIs (specifically the token exchange endpoint) actively block or return 400/403
// for requests lacking a User-Agent, which causes NextAuth to throw a 500 OAuthCallbackError.
// We intercept all NextAuth fetches here to ensure Google accepts them.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url: any, options: any) => {
  const customOptions = options || {};
  customOptions.headers = {
    ...customOptions.headers,
    "User-Agent": "KarmaApp/1.0.0 (Cloudflare Pages)",
  };
  return originalFetch(url, customOptions);
};

export const { GET, POST } = handlers;
