import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import authOptions from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (req.method !== "PATCH") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { taskId, newStatus } = req.body;

    if (!taskId || !newStatus) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const client = await clientPromise;
    const db = client.db("app");

    const result = await db.collection("tasks").updateOne(
      { _id: new ObjectId(taskId) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(), 
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    res.status(200).json({ message: "Tarea actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar la tarea:", error);
    res.status(500).json({ error: "Error al actualizar la tarea" });
  }
}