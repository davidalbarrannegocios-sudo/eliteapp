import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [],
  callbacks: {
    // Re-apply token fields so middleware can read role without importing Prisma
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role as string | undefined;
      const { pathname } = nextUrl;

      const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/role-select"];
      const isPublicRoute = publicRoutes.includes(pathname);
      const isJoinRoute = pathname.startsWith("/join/");
      const isApiRoute = pathname.startsWith("/api/");

      if (isApiRoute || isJoinRoute) return true;

      // Admin routes: only ADMIN role
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn || role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isPublicRoute) return false;
      if (isLoggedIn && (pathname === "/auth/login" || pathname === "/auth/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
};
