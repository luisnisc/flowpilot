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

    const { projectId } = req.query;
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ error: "ID de proyecto requerido" });
    }

    const client = await clientPromise;
    const db = client.db("app");

    // No necesitamos convertir a ObjectId si tu projectId se almacena como string
    // Si se almacena como ObjectId, necesitarás convertirlo

    // Comprobar si el usuario tiene acceso al proyecto
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId), // Si tu _id es un ObjectId, usa new ObjectId(projectId)
      $or: [
        { ownerId: session.user.email },
        { members: { $elemMatch: { email: session.user.email } } },
      ],
    });


    // Contar tareas por estado
    const taskStats = {
      pending: await db
        .collection("tasks")
        .countDocuments({ project: projectId, status: "pending" }),
      in_progress: await db
        .collection("tasks")
        .countDocuments({ project: projectId, status: "in_progress" }),
      review: await db
        .collection("tasks")
        .countDocuments({ project: projectId, status: "review" }),
      done: await db
        .collection("tasks")
        .countDocuments({ project: projectId, status: "done" }),
    };

    res.status(200).json({ taskStats });
  } catch (error) {
    console.error("Error al obtener estadísticas de tareas:", error);
    res
      .status(500)
      .json({
        error: "Error al obtener estadísticas de tareas",
        details: String(error),
      });
  }
}
