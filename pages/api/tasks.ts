import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import NextAuthOptions from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, NextAuthOptions);
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const client = await clientPromise;
  const db = client.db("test");
  if (req.method === "POST") {
    const { title, description, groupId, assignedTo } = req.body;
    const result = await db.collection("tasks").insertOne({ title, description, groupId, assignedTo, status: "pending" });
    return res.status(201).json(result.ops[0]);
  } else if (req.method === "GET") {
    const tasks = await db.collection("tasks").find().toArray();
    return res.status(200).json(tasks);
  }
  res.status(405).end();
}