import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Kullanıcı Adı / Bayi Kodu", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
          };
        }

        return null;
      },
    }),
  ],
});
