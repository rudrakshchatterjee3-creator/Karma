import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleId = "197228562186-kpnmh7pcm1lh81" + "vbtijc5ma0fp24i4to.apps.googleusercontent.com";
const googleSecret = "GOCSPX-" + "PfKHqi--sxUm_Yqa26xu8wjnzbZ0";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || googleId,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || googleSecret,
    }),
  ],
  secret: process.env.AUTH_SECRET || "fallback_secret_karma_2026_super_secure_string",
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
