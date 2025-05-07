import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID de tarea requerido" });
    }

    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db("app");
    const tasksCollection = db.collection("tasks");

    // Verificar si la tarea existe y pertenece a un proyecto del usuario
    const task = await tasksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!task) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    // Manejar diferentes métodos HTTP
    switch (req.method) {
      case "PATCH":
        const { status } = req.body;

        // Validar estado
        const validStatuses = ["pending", "in_progress", "review", "done"];
        if (status && !validStatuses.includes(status)) {
          return res.status(400).json({ error: "Estado inválido" });
        }

        // Actualizar tarea
        const updateResult = await tasksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status, updatedAt: new Date() } }
        );

        if (updateResult.modifiedCount === 0) {
          return res
            .status(404)
            .json({ error: "No se pudo actualizar la tarea" });
        }

        // Obtener tarea actualizada
        const updatedTask = await tasksCollection.findOne({
          _id: new ObjectId(id),
        });

        return res.status(200).json(updatedTask);

      default:
        res.setHeader("Allow", ["PATCH"]);
        return res
          .status(405)
          .json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error("Error en API de tareas:", error);
    return res.status(500).json({
      error: "Error en el servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
