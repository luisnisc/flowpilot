import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

console.log("Base URL:", baseUrl);

const githubCredentials = {
  clientId: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackUrl: `${baseUrl}/api/auth/callback/github`,
  allowDangerousEmailAccountLinking: true,
};

const googleCredentials = {
  clientId: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  allowDangerousEmailAccountLinking: true,
};

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  adapter: MongoDBAdapter(clientPromise, { databaseName: "app" }),
  session: { strategy: "jwt" },
  urls: {
    baseUrl,
    origin: baseUrl,
  },
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;

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
        try {
          const client = await clientPromise;
          const db = client.db("app");

          // Normalizar email
          const normalizedEmail = credentials.email.toLowerCase().trim();

          const user = await db.collection("users").findOne({
            email: normalizedEmail,
          });

          if (!user) return null;

          // Si el usuario existe pero no tiene contraseña (se registró con Google/GitHub)
          if (!user.password) {
            return null; // No permitir inicio de sesión con credenciales para usuarios de OAuth
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "user",
            image: user.image, // Si tienen imagen de perfil
          };
        } catch (error) {
          console.error("Error en authorize de credenciales:", error);
          return null;
        }
      },
    }),
    GoogleProvider(googleCredentials),
    GithubProvider(githubCredentials),
  ],
};

export default NextAuth(authOptions);