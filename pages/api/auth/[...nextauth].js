import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

// Determinar la URL base según el entorno
const baseUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  adapter: MongoDBAdapter(clientPromise, { databaseName: "app" }),
  session: { strategy: "jwt" },

  // URLs personalizadas para manejar múltiples entornos
  urls: {
    baseUrl,
    origin: baseUrl,
  },

  // Mejores callbacks para manejar redirecciones
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
      }
      if (account && profile) {
        const img = profile.picture || profile.avatar_url;
        if (img) token.picture = img;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    },
    // Manejo adecuado de redirecciones
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, concatenarla con baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permitir redirecciones a dominios válidos
      if (new URL(url).origin === baseUrl) return url;
      if (
        url.startsWith("http://localhost:3000") &&
        process.env.NODE_ENV === "development"
      ) {
        return url;
      }
      return baseUrl;
    },
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db("app");
        const user = await db
          .collection("users")
          .findOne({ email: credentials.email });
        if (!user) return null;
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
};

export default NextAuth(authOptions);
