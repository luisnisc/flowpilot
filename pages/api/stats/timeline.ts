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

    // Comprobar si el usuario tiene acceso al proyecto
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      $or: [
        { ownerId: session.user.email },
        { members: { $elemMatch: { email: session.user.email } } },
      ],
    });

    // Obtener los últimos 14 días para el análisis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14);

    // Obtener tareas completadas por día usando updatedAt
    const tasksCompleted = await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            projectId: projectId,
            status: "done",
            updatedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Generar array de fechas para los últimos 14 días
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      dates.push(dateString);
    }

    // Crear timeline con datos completos
    const timeline = dates.map((date) => {
      const completed = tasksCompleted.find((item) => item._id === date);
      return {
        date: date.substring(5), // Solo mostrar MM-DD para más claridad
        completed: completed ? completed.count : 0,
      };
    });

    res.status(200).json({ timeline });
  } catch (error) {
    console.error("Error al obtener timeline de tareas:", error);
    res.status(500).json({ error: "Error al obtener timeline de tareas" });
  }
}

// En ProjectDetails.tsx, asegúrate que el efecto para cargar los datos maneja posibles errores
