import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { email, name, password } = req.body;
  const client = await clientPromise;
  const db = client.db("app");
  const existing = await db.collection("users").findOne({ email });
  if (existing) return res.status(409).json({ error: "Usuario ya existe" });

  const hash = await bcrypt.hash(password, 12);
  const result = await db
    .collection("users")
    .insertOne({ email, name, password: hash, role: "user" });
  return res.status(201).json({ id: result.insertedId, email, name, role: "user" });
}
