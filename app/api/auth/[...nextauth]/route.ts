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
      from: process.env.EMAIL_FROM || "noreply@hubmovies-cd.com",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("Missing credentials", {
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password,
            });
            return null;
          }

          const email = String(credentials.email).toLowerCase().trim();
          const password = String(credentials.password).trim();

          const adminList =
            process.env.ADMIN_ACCOUNTS
              ?.split(",")
              .map((e) => e.trim().toLowerCase())
              .filter(Boolean) || [];
          const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();

          // Admin shortcut: allow env-configured admins with shared password.
          // Fallback: if shared password doesn't match, allow existing hashed password.
          if (adminList.includes(email)) {
            await connectDB();

            let adminUser = await User.findOne({ email });
            const envPasswordMatches = !!adminPassword && password === adminPassword;

            if (!envPasswordMatches && adminUser?.passwordHash) {
              const hashMatches = await bcrypt.compare(password, adminUser.passwordHash);
              if (!hashMatches) {
                console.error("Invalid admin password", { email });
                return null;
              }
            } else if (!envPasswordMatches && !adminUser?.passwordHash) {
              console.error("Invalid admin password", { email });
              return null;
            }

            if (!adminUser) {
              const passwordHash = await bcrypt.hash(password, 10);
              adminUser = await User.create({
                email,
                passwordHash,
                role: "ADMIN",
                emailVerified: new Date(),
              });
            } else {
              let changed = false;
              if (adminUser.role !== "ADMIN") {
                adminUser.role = "ADMIN";
                changed = true;
              }
              if (!adminUser.emailVerified) {
                adminUser.emailVerified = new Date();
                changed = true;
              }
              if (!adminUser.passwordHash || envPasswordMatches) {
                adminUser.passwordHash = await bcrypt.hash(password, 10);
                changed = true;
              }
              if (changed) {
                await adminUser.save();
              }
            }

            return {
              id: adminUser._id.toString(),
              email: adminUser.email!,
              name: adminUser.name,
              image: adminUser.image,
              role: "ADMIN",
              emailVerified: !!adminUser.emailVerified,
              profileCompletion: adminUser.profileCompletion || 0,
              paymentConfirmed: !!adminUser.paymentConfirmed,
            };
          }

          await connectDB();

          const user = await User.findOne({ email });
          if (!user || !user.passwordHash) {
            console.error("User not found or no password hash", { email });
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            console.error("Invalid password", { email });
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email!,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: !!user.emailVerified,
            profileCompletion: user.profileCompletion || 0,
            paymentConfirmed: !!user.paymentConfirmed,
          };
        } catch (error) {
          console.error("Authorize error:", {
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth",
    verifyRequest: "/auth/send-otp",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified || false;
        token.name = (user as any).name;
        token.profileCompletion = (user as any).profileCompletion || 0;
        token.paymentConfirmed = (user as any).paymentConfirmed || false;
      } else if (token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.role = dbUser.role;
          token.emailVerified = !!dbUser.emailVerified;
          token.name = dbUser.name;
          token.profileCompletion = dbUser.profileCompletion || 0;
          token.paymentConfirmed = !!dbUser.paymentConfirmed;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).emailVerified = token.emailVerified as boolean;
        (session.user as any).name = token.name as string;
        (session.user as any).profileCompletion = token.profileCompletion as number;
        (session.user as any).paymentConfirmed = token.paymentConfirmed as boolean;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account && user.email) {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (account.provider === "email" && !existingUser) {
          return true;
        }
      }
      return true;
    },
  },
};

const { handlers, auth } = NextAuth(authOptions);

export const { GET, POST } = handlers;
export { auth };
