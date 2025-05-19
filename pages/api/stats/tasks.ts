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

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      $or: [
        { ownerId: session.user.email },
        { members: { $elemMatch: { email: session.user.email } } },
      ],
    });

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
    res.status(500).json({
      error: "Error al obtener estadísticas de tareas",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
