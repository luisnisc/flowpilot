import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import  authOptions  from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Obtener el ID (email) del usuario
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Identificador de usuario inválido" });
    }

    // Decodificar el email si está codificado en la URL
    const email = decodeURIComponent(id);

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db("app");
    const usersCollection = db.collection("users");

    // GET - Obtener un usuario
    if (req.method === "GET") {
      const user = await usersCollection.findOne(
        { email },
        { projection: { password: 0 } } // No devolver la contraseña
      );

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      return res.status(200).json(user);
    } 
    
    // PATCH - Actualizar un usuario
    else if (req.method === "PATCH") {
      const { name, role } = req.body;

      // Validar campos
      if (!name && !role) {
        return res.status(400).json({ 
          error: "Se requiere al menos un campo para actualizar" 
        });
      }

     

      // Preparar datos para la actualización
      const updateData: Record<string, any> = {};
      if (name) updateData.name = name;
      if (role && session.user.role === "admin") updateData.role = role;

      // Realizar la actualización
      const result = await usersCollection.updateOne(
        { email },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Obtener el usuario actualizado (sin la contraseña)
      const updatedUser = await usersCollection.findOne(
        { email },
        { projection: { password: 0 } }
      );

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        user: updatedUser
      });
    } 
    
    // DELETE - Eliminar un usuario (solo administradores)
    else if (req.method === "DELETE") {
      // Solo administradores pueden eliminar usuarios
     

      // Evitar que un administrador se elimine a sí mismo
      if (email === session.user.email) {
        return res.status(400).json({
          error: "No puedes eliminar tu propia cuenta"
        });
      }

      const result = await usersCollection.deleteOne({ email });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Usuario eliminado correctamente" 
      });
    }

    // Método no permitido
    return res.status(405).json({ 
      error: `Método ${req.method} no permitido` 
    });
    
  } catch (error) {
    console.error("Error en API de usuarios:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
}