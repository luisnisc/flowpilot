import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query; // Este debería ser el email del usuario que se está modificando
  const email = id as string; // Convertir el parámetro a string

  // Verificar autenticación
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  // Solo permitir al propio usuario o admin
  if (session.user.email !== email && session.user.role !== "admin") {
    return res.status(403).json({ error: "No autorizado" });
  }

  // Conectar a la base de datos
  const client = await clientPromise;
  const db = client.db("app");

  switch (req.method) {
    case "GET":
      try {
        const user = await db.collection("users").findOne({ email });
        if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }
        return res.status(200).json(user);
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
        return res.status(500).json({ error: "Error en el servidor" });
      }

    case "PATCH":
      try {
        const { name, email: newEmail, role } = req.body;

        // Validar si el nuevo email ya existe SOLO SI se está cambiando el email
        if (newEmail && newEmail !== email) {
          // Solo verificar si es un email diferente al actual
          console.log(`Verificando si el nuevo email ${newEmail} ya existe...`);
          const existingUser = await db
            .collection("users")
            .findOne({ email: newEmail });
          if (existingUser) {
            console.log("Email ya está en uso");
            return res.status(409).json({ error: "El email ya está en uso" });
          }
        }

        // Preparar objeto de actualización
        const updateData: any = {};
        if (name) updateData.name = name;
        if (newEmail) updateData.email = newEmail;
        if (role && session.user.role === "admin") updateData.role = role;

        console.log("Datos a actualizar:", updateData);

        // Si no hay datos para actualizar, devolver el usuario actual
        if (Object.keys(updateData).length === 0) {
          const currentUser = await db.collection("users").findOne({ email });
          return res.status(200).json(currentUser);
        }

        // Actualizar usuario
        const result = await db
          .collection("users")
          .updateOne({ email }, { $set: updateData });

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Buscar el usuario actualizado con el email correcto (que puede ser el nuevo o el mismo)
        const updatedUser = await db
          .collection("users")
          .findOne({ email: newEmail || email });

        return res.status(200).json(updatedUser);
      } catch (error) {
        console.error("Error actualizando usuario:", error);
        return res.status(500).json({
          error: "Error en el servidor",
          details: error instanceof Error ? error.message : "Error desconocido",
        });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PATCH"]);
      res.status(405).end(`Método ${req.method} no permitido`);
  }
}
