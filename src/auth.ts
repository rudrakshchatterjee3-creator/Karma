if (typeof process === "undefined") {
  (globalThis as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
} else if (!process.env) {
  (process as unknown as { env: Record<string, string> }).env = {};
}

// Ensure we pull from environment variables for security compliance
const googleId = process.env.AUTH_GOOGLE_ID as string;
const googleSecret = process.env.AUTH_GOOGLE_SECRET as string;
const nextAuthSecret = process.env.AUTH_SECRET as string;

// Unconditionally override environment to protect NextAuth internals if running locally without full env
if (!process.env.AUTH_URL) process.env.AUTH_URL = "https://karma-3jf.pages.dev";
if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = "https://karma-3jf.pages.dev";

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    }),
  ],
  secret: nextAuthSecret,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
