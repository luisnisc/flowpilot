import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
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
    const session = (await getServerSession(
      req,
      res,
      authOptions
    )) as Session | null;
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
    let projectQuery;
    try {
      // Intentar crear un ObjectId con el projectId
      const projectObjectId = new ObjectId(projectId);
      projectQuery = { _id: projectObjectId };
    } catch (error) {
      console.log("ID de proyecto no es un ObjectId válido");
      // Si no es un ObjectId válido, buscar por otros campos
      projectQuery = {
        $or: [
          { _id: projectId }, // Intentar como string de todas formas
          { name: projectId },
          { slug: projectId },
        ],
      };
    }

    const project = await db.collection("projects").findOne({
      ...projectQuery,
      $or: [
        { ownerId: session.user.email },
        { users: session.user.email },
        { members: { $elemMatch: { email: session.user.email } } },
      ],
    });

    if (!project) {
      console.log("Proyecto no encontrado o usuario sin acceso");
    }

    // Obtener los últimos 14 días para el análisis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14);

    console.log(
      `Buscando tareas desde ${startDate.toISOString()} hasta ${endDate.toISOString()}`
    );
    console.log(`Buscando en proyecto: ${projectId}`);

    // Obtener tareas completadas por día usando updatedAt
    const tasksCompleted = await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            project: projectId,
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

    console.log("Tareas completadas encontradas:", tasksCompleted.length);

    // Obtener tareas creadas por día
    const tasksCreated = await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            project: projectId,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    console.log("Tareas creadas encontradas:", tasksCreated.length);

    // Tareas que pasaron a estado in_progress
    const tasksInProgress = await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            project: projectId,
            status: "in_progress",
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

    // Tareas que pasaron a review
    const tasksInReview = await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            project: projectId,
            status: "review",
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
      const created = tasksCreated.find((item) => item._id === date);
      const inProgress = tasksInProgress.find((item) => item._id === date);
      const inReview = tasksInReview.find((item) => item._id === date);

      const completedCount = completed ? completed.count : 0;
      const createdCount = created ? created.count : 0;
      const inProgressCount = inProgress ? inProgress.count : 0;
      const inReviewCount = inReview ? inReview.count : 0;

      return {
        date: date.substring(5), // Solo mostrar MM-DD para más claridad
        completed: completedCount,
        created: createdCount,
        inProgress: inProgressCount,
        inReview: inReviewCount,
        comments: 0, // Implementar si hay comentarios
        activity:
          completedCount + createdCount + inProgressCount + inReviewCount,
      };
    });

    res.status(200).json({ timeline });
  } catch (error) {
    console.error("Error al obtener timeline de tareas:", error);
    res.status(500).json({
      error: "Error al obtener timeline de tareas",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
