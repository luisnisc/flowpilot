import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import NextAuthOptions from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, NextAuthOptions);
  if (!session) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  const client = await clientPromise;
  const db = client.db("app");

  if (req.method === "GET") {
    try {
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      return res.status(200).json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "PATCH") {
    try {
      const { status, title, description, priority, assignedTo } = req.body;

      if (
        status &&
        !["pending", "in_progress", "review", "done"].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (assignedTo) updateData.assignedTo = assignedTo;
      const result = await db
        
        .collection("tasks")
        .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      const updatedTask = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "DELETE") {
    try {
      const result = await db
        .collection("tasks")
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
