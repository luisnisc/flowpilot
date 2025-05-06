import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions as nextAuthOptions } from "../auth/[...nextauth]";
import { Session } from "next-auth"; 
import { AuthOptions } from "next-auth";
import clientPromise from "../../../lib/mongodb";

const authOptions = nextAuthOptions as AuthOptions;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = (await getServerSession( req, res, authOptions )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "No autorizado" });
    }
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res
        .status(400)
        .json({ error: "Identificador de usuario inválido" });
    }
    const email = decodeURIComponent(id);

    const client = await clientPromise;
    const db = client.db("app");
    const usersCollection = db.collection("users");

    if (req.method === "GET") {
      const user = await usersCollection.findOne(
        { email },
        { projection: { password: 0 } } 
      );

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.status(200).json(user);
    }

    else if (req.method === "PATCH") {
      const { name, role } = req.body;

      if (!name && !role) {
        return res.status(400).json({
          error: "Se requiere al menos un campo para actualizar",
        });
      }

      const updateData: Record<string, any> = {};
      if (name) updateData.name = name;
      if (role && session.user.role === "admin") updateData.role = role;

      const result = await usersCollection.updateOne(
        { email },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const updatedUser = await usersCollection.findOne(
        { email },
        { projection: { password: 0 } }
      );

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        user: updatedUser,
      });
    }

    else if (req.method === "DELETE") {
      if (email === session.user.email) {
        return res.status(400).json({
          error: "No puedes eliminar tu propia cuenta",
        });
      }

      const result = await usersCollection.deleteOne({ email });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Usuario eliminado correctamente",
      });
    }

    return res.status(405).json({
      error: `Método ${req.method} no permitido`,
    });
  } catch (error) {
    console.error("Error en API de usuarios:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
