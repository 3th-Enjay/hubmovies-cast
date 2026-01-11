import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongooseAdapter } from "@/lib/auth-adapter";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthConfig = {
  adapter: MongooseAdapter(),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@hubmovies.com",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        await connectDB();
        const user = await User.findOne({ email });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email!,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: !!user.emailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth",
    verifyRequest: "/auth/check-email",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - user object is available
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || (user as any).role;
        token.emailVerified = (user as any).emailVerified || false;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Pass token data to session
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account && user.email) {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        
        // For email provider, set role if user is new
        if (account.provider === "email" && !existingUser) {
          // Role will be set when user completes signup via /auth/complete
          return true;
        }
      }
      return true;
    },
  },
};

const { handlers, auth } = NextAuth(authOptions);

// Export handlers
export const { GET, POST } = handlers;

// Export auth function for use in server components and API routes
export { auth };

