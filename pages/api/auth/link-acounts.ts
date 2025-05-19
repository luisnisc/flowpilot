import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";
import authOptions from "./[...nextauth]";

interface Session{
    user?: {
        email?: string;
        name?: string;
    };
}



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions) as Session;
    if (!session || !session.user?.email || !session.user?.name) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const client = await clientPromise;
    const db = client.db("app");

    const email = session.user.email.toLowerCase().trim();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.password) {
      return res.status(400).json({ error: "Este usuario ya tiene contraseña configurada" });
    }

    const hash = await bcrypt.hash(password, 12);
    await db.collection("users").updateOne(
      { email },
      { $set: { password: hash } }
    );

    return res.status(200).json({ 
      success: true,
      message: "Contraseña establecida correctamente. Ahora puedes iniciar sesión con tu email y contraseña."
    });
  } catch (error) {
    console.error("Error al vincular cuenta:", error);
    return res.status(500).json({ error: "Error al procesar la solicitud" });
  }
}