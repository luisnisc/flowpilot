import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import  authOptions  from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";


interface SessionUser {
  user?: {
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check authentication
    const session = (await getServerSession(
      req,
      res,
      authOptions
    )) as SessionUser;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    
    const client = await clientPromise;
    const db = client.db("app");
    const messagesCollection = db.collection("messages");

    
    if (req.method === "GET") {
      const { projectId } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const messages = await messagesCollection
        .find({ projectId: projectId as string })
        .sort({ timestamp: 1 })
        .toArray();
      const serializedMessages = messages.map((message) => ({
        ...message,
        _id: message._id.toString(),
      }));

      return res.status(200).json(serializedMessages);
    }
    else if (req.method === "POST") {
      const { projectId, message, user } = req.body;

      if (!projectId || !message) {
        return res
          .status(400)
          .json({ error: "Project ID and message are required" });
      }
      if (user !== session.user.email) {
        return res
          .status(403)
          .json({ error: "You can only send messages as yourself" });
      }

      const timestamp = new Date().toISOString();
      const newMessage = {
        projectId,
        user,
        message,
        timestamp,
      };

      const result = await messagesCollection.insertOne(newMessage);

      return res.status(201).json({
        _id: result.insertedId.toString(),
        ...newMessage,
      });
    }
    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Error en API de mensajes:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
