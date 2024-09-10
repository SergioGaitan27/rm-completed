// app/lib/actions/auth.ts
import { connectDB } from "@/app/lib/db/mongodb";
import User from "@/app/lib/models/User";
import type { NextAuthOptions } from "next-auth";
import type { User as AuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@/app/types/next-auth";

export const getAuthOptions = (): NextAuthOptions => ({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("MissingCredentials");
          }
    
          await connectDB();
        
          const user = await User.findOne({
            email: credentials.email,
          }).select("+password");
        
          if (!user) {
            throw new Error("UserNotFound");
          }
        
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
        
          if (!passwordMatch) {
            throw new Error("IncorrectPassword");
          }
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            phone: user.phone,
            image: user.image,
            location: user.location,
          };
        } catch (error) {
          // console.error("Error in authorize function:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.image = user.image;
        token.location = user.location;
      }
      // console.log("JWT callback - token:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string | undefined;
        session.user.image = token.image as string | undefined;
        session.user.location = token.location as string | undefined;
      }
      // console.log("Session callback - session:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours
  },
  jwt: {
    maxAge: 12 * 60 * 60, // 12 hours
  },
  secret: process.env.AUTH_SECRET
});

export default getAuthOptions;