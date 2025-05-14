import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

interface SessionUser {
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}

interface Session {
  user?: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar sesión
    const session = (await getServerSession(
      req,
      res,
      authOptions
    )) as Session | null;
    if (!session) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID de proyecto requerido" });
    }

    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db("app");
    const projectsCollection = db.collection("projects");

    // Intentar buscar el proyecto, primero como ObjectId y luego como string
    let project = null;
    let projectObjectId;

    // Intentar convertir a ObjectId
    try {
      projectObjectId = new ObjectId(id);

      // Buscar por ObjectId
      project = await projectsCollection.findOne({
        _id: projectObjectId,
      });

      console.log("Búsqueda por ObjectId:", !!project);
    } catch (err) {
      console.log("Error al convertir ID a ObjectId:", err);
      // No hacemos return aquí para permitir buscar como string
    }

    // Si no se encontró por ObjectId, intentar buscar como string usando query por campo personalizado
    if (!project) {
      project = await projectsCollection.findOne({
        _id: id as any, 
      });
      console.log("Búsqueda por string ID:", !!project);
    }

    // Agregar un log para depuración
    console.log("Buscando proyecto con ID:", id);
    console.log("Proyecto encontrado:", project ? "Sí" : "No");

    if (!project) {
      return res.status(404).json({
        error: "Proyecto no encontrado",
        details: "El proyecto no existe con este ID en ningún formato",
      });
    }

    // Manejar diferentes métodos HTTP
    switch (req.method) {
      case "GET":
        return res.status(200).json(project);

      case "PATCH":
        // Solo se permite actualizar ciertos campos
        const updateData: any = {};

        // Si se proporcionan usuarios para añadir o eliminar
        if (req.body.users && Array.isArray(req.body.users)) {
          const currentUsers = project.users || [];

          // Si la acción es remover usuarios
          if (req.body.action === "remove") {
            const updatedUsers = currentUsers.filter((user: any) => {
              const userEmail = typeof user === "string" ? user : user.email;
              return !req.body.users.includes(userEmail);
            });
            updateData.users = updatedUsers;
          }
          // Si la acción es añadir usuarios o no se especifica acción (comportamiento por defecto)
          else {
            const newUsers = req.body.users.filter(
              (user: string) => !currentUsers.includes(user)
            );

            // Actualizar solo si hay nuevos usuarios para añadir
            if (newUsers.length > 0) {
              updateData.users = [...currentUsers, ...newUsers];
            }
          }
        }

        // Mantener compatibilidad con el método removeUser anterior
        if (req.body.removeUser && typeof req.body.removeUser === "string") {
          // Obtener usuarios actuales y eliminar el usuario especificado
          const currentUsers = project.users || [];
          const updatedUsers = currentUsers.filter((user: any) => {
            // Manejar tanto strings como objetos user
            const userEmail = typeof user === "string" ? user : user.email;
            return userEmail !== req.body.removeUser;
          });

          // Actualizar la lista de usuarios
          updateData.users = updatedUsers;
        }

        // Para otras actualizaciones como nombre, descripción, etc.
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.status) updateData.status = req.body.status;

        // Solo actualizar si hay datos para actualizar
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({
            error: "No se proporcionaron datos válidos para actualizar",
          });
        }

        // Realizar la actualización - usar el mismo tipo de ID que se usó para encontrar el proyecto
        const updateResult = await projectsCollection.updateOne(
          { _id: project._id }, // Usamos el _id que ya encontramos
          { $set: updateData }
        );

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({
            error: "No se pudo actualizar el proyecto",
          });
        }

        // Obtener proyecto actualizado
        const updatedProject = await projectsCollection.findOne({
          _id: project._id, // Usamos el _id que ya encontramos
        });

        return res.status(200).json(updatedProject);

      case "DELETE":
        // Solo administradores pueden eliminar proyectos
        const isAdmin = session.user?.role === "admin";
        if (!isAdmin) {
          return res.status(403).json({
            error: "Solo los administradores pueden eliminar proyectos",
          });
        }

        // Eliminar proyecto - usar el mismo tipo de ID que se usó para encontrar el proyecto
        const deleteResult = await projectsCollection.deleteOne({
          _id: project._id, // Usamos el _id que ya encontramos
        });

        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        return res.status(200).json({
          message: "Proyecto eliminado correctamente",
        });

      case "PUT":
        // Verificar que el cuerpo de la solicitud contiene los campos necesarios
        if (
          !req.body.users ||
          !Array.isArray(req.body.users) ||
          req.body.users.length === 0
        ) {
          return res.status(400).json({
            error: "Se requiere un array de usuarios para añadir",
          });
        }

        // Obtener la lista actual de usuarios del proyecto
        const existingUsers = project.users || [];

        // Filtrar para solo añadir usuarios que no están ya en el proyecto
        const usersToAdd = req.body.users.filter(
          (user: string) => !existingUsers.includes(user)
        );

        // Si no hay nuevos usuarios para añadir, devolver un mensaje
        if (usersToAdd.length === 0) {
          return res.status(200).json({
            message: "No hay nuevos usuarios para añadir",
            project,
          });
        }

        // Añadir los nuevos usuarios al proyecto
        const updatedUsers = [...existingUsers, ...usersToAdd];

        // Actualizar el proyecto en la base de datos
        const putResult = await projectsCollection.updateOne(
          { _id: project._id },
          { $set: { users: updatedUsers } }
        );

        if (putResult.matchedCount === 0) {
          return res.status(404).json({
            error: "No se pudo actualizar el proyecto",
          });
        }

        // Obtener el proyecto actualizado
        const projectWithNewUsers = await projectsCollection.findOne({
          _id: project._id,
        });

        return res.status(200).json({
          message: `Se añadieron ${usersToAdd.length} usuarios al proyecto`,
          addedUsers: usersToAdd,
          project: projectWithNewUsers,
        });

      default:
        res.setHeader("Allow", ["GET", "PATCH", "DELETE", "PUT"]);
        return res.status(405).json({
          error: `Método ${req.method} no permitido`,
        });
    }
  } catch (error) {
    console.error("Error en API de proyectos:", error);
    return res.status(500).json({
      error: "Error en el servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
