import "next-auth";
import "next-auth/jwt";

// Extender la interfaz Session
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "admin" | "user";
      id?: string;
    }
  }

  interface User {
    role?: "admin" | "user";
    id?: string;
  }
}

// Extender JWT
declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "user";
    id?: string;
  }
}