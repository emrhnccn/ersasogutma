import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/bayi/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isBayiRoute = nextUrl.pathname.startsWith('/bayi');
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      
      const role = auth?.user?.role;

      // Handle Admin routes
      if (isAdminRoute) {
        if (nextUrl.pathname === '/admin/login') {
          if (isLoggedIn && role === 'ADMIN') {
            return Response.redirect(new URL('/admin', nextUrl));
          }
          return true;
        }
        if (!isLoggedIn || role !== 'ADMIN') {
          return Response.redirect(new URL('/admin/login', nextUrl));
        }
        return true;
      }

      // Handle Bayi routes
      if (isBayiRoute) {
        if (nextUrl.pathname === '/bayi/login') {
          if (isLoggedIn && role === 'B2B_DEALER') {
            return Response.redirect(new URL('/bayi', nextUrl));
          }
          return true;
        }
        if (!isLoggedIn || role !== 'B2B_DEALER') {
          return Response.redirect(new URL('/bayi/login', nextUrl));
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string;
        token.id = user.id as string;
        token.username = (user as any).username;
        token.companyId = (user as any).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        (session.user as any).companyId = token.companyId as string | undefined;
      }
      return session;
    }
  },
  providers: [],
} satisfies NextAuthConfig;
