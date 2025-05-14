import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const client = await clientPromise;
        const db = client.db("app");

        if (req.method === "GET") {
            const users = await db.collection("users").find().toArray();
            return res.status(200).json(users);
        } else if (req.method === "POST") {
            const { name, email, role } = req.body;
            const result = await db.collection("users").insertOne({ name, email, role });
            return res.status(201).json(result);
        }
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
}