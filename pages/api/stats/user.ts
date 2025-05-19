import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../lib/mongodb";
import authOptions from "../auth/[...nextauth]";

interface SessionUser {
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}
interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { email } = req.query;

    if (email !== session.user.email && session.user.role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const client = await clientPromise;
    const db = client.db("app");

    const total = await db.collection("tasks").countDocuments({
      assignedTo: email,
    });

    const completed = await db.collection("tasks").countDocuments({
      assignedTo: email,
      status: "done",
    });

    res.status(200).json({
      email,
      total,
      completed,
      pending: total - completed,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de usuario:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de usuario" });
  }
}
