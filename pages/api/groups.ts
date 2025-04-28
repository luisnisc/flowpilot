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
    const { name, members } = req.body;
    const result = await db.collection("groups").insertOne({ name, members, createdBy: session.user.email });
    return res.status(201).json(result.ops[0]);
  } else if (req.method === "GET") {
    const groups = await db.collection("groups").find().toArray();
    return res.status(200).json(groups);
  }
  res.status(405).end();
}