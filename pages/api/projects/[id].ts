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

    const client = await clientPromise;
    const db = client.db("app");
    const projectsCollection = db.collection("projects");

    let project = null;
    let projectObjectId;

    try {
      projectObjectId = new ObjectId(id);

      project = await projectsCollection.findOne({
        _id: projectObjectId,
      });

      console.log("Búsqueda por ObjectId:", !!project);
    } catch (err) {
      console.log("Error al convertir ID a ObjectId:", err);
    }

    if (!project) {
      project = await projectsCollection.findOne({
        _id: id as any, 
      });
      console.log("Búsqueda por string ID:", !!project);
    }

    console.log("Buscando proyecto con ID:", id);
    console.log("Proyecto encontrado:", project ? "Sí" : "No");

    if (!project) {
      return res.status(404).json({
        error: "Proyecto no encontrado",
        details: "El proyecto no existe con este ID en ningún formato",
      });
    }

    switch (req.method) {
      case "GET":
        return res.status(200).json(project);

      case "PATCH":
        const updateData: any = {};

        if (req.body.users && Array.isArray(req.body.users)) {
          const currentUsers = project.users || [];

          if (req.body.action === "remove") {
            const updatedUsers = currentUsers.filter((user: any) => {
              const userEmail = typeof user === "string" ? user : user.email;
              return !req.body.users.includes(userEmail);
            });
            updateData.users = updatedUsers;
          }
          else {
            const newUsers = req.body.users.filter(
              (user: string) => !currentUsers.includes(user)
            );

            if (newUsers.length > 0) {
              updateData.users = [...currentUsers, ...newUsers];
            }
          }
        }

        if (req.body.removeUser && typeof req.body.removeUser === "string") {
          const currentUsers = project.users || [];
          const updatedUsers = currentUsers.filter((user: any) => {
            const userEmail = typeof user === "string" ? user : user.email;
            return userEmail !== req.body.removeUser;
          });
          updateData.users = updatedUsers;
        }

        if (req.body.name) updateData.name = req.body.name;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.status) updateData.status = req.body.status;

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({
            error: "No se proporcionaron datos válidos para actualizar",
          });
        }

        const updateResult = await projectsCollection.updateOne(
          { _id: project._id },
          { $set: updateData }
        );

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({
            error: "No se pudo actualizar el proyecto",
          });
        }

        const updatedProject = await projectsCollection.findOne({
          _id: project._id, 
        });

        return res.status(200).json(updatedProject);

      case "DELETE":
        const isAdmin = session.user?.role === "admin";
        if (!isAdmin) {
          return res.status(403).json({
            error: "Solo los administradores pueden eliminar proyectos",
          });
        }

        const deleteResult = await projectsCollection.deleteOne({
          _id: project._id, 
        });

        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        return res.status(200).json({
          message: "Proyecto eliminado correctamente",
        });

      case "PUT":
        if (
          !req.body.users ||
          !Array.isArray(req.body.users) ||
          req.body.users.length === 0
        ) {
          return res.status(400).json({
            error: "Se requiere un array de usuarios para añadir",
          });
        }

        const existingUsers = project.users || [];

        const usersToAdd = req.body.users.filter(
          (user: string) => !existingUsers.includes(user)
        );

        if (usersToAdd.length === 0) {
          return res.status(200).json({
            message: "No hay nuevos usuarios para añadir",
            project,
          });
        }

        const updatedUsers = [...existingUsers, ...usersToAdd];

        const putResult = await projectsCollection.updateOne(
          { _id: project._id },
          { $set: { users: updatedUsers } }
        );

        if (putResult.matchedCount === 0) {
          return res.status(404).json({
            error: "No se pudo actualizar el proyecto",
          });
        }

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
