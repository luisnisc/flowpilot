import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import NextAuthOptions from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, NextAuthOptions);
  const client = await clientPromise;
  const db = client.db("app");
  if (req.method === "POST") {
    const { name, description, users, status } = req.body;
    const result = await db.collection("projects").insertOne({ name, description, users, status});
    return res.status(201).json(result);
  } else if (req.method === "GET") {
    const projects = await db.collection("projects").find().toArray();
    return res.status(200).json(projects);
  }
  res.status(405).end();
}