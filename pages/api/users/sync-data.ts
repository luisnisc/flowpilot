import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // 1. Verificar autenticación
    const session = await getServerSession(req, res, authOptions);

    // 2. Verificar que el usuario es el mismo que está haciendo cambios
    const { oldEmail, newEmail, oldName, newName } = req.body;

    if (!oldEmail) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }


    // 3. Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db("app");

    // 4. Preparar los resultados de la sincronización
    const results = {
      projects: { updated: 0, errors: 0 },
      tasks: { updated: 0, errors: 0 },
      messages: { updated: 0, errors: 0 }
    };

    // 5. Actualizar proyectos donde el usuario es el creador
    try {
      const projectsResult = await db.collection("projects").updateMany(
        { createdBy: oldEmail },
        { 
          $set: { 
            createdBy: newEmail || oldEmail,
            createdByName: newName || oldName
          } 
        }
      );
      results.projects.updated = projectsResult.modifiedCount;
    } catch (error) {
      console.error("Error actualizando proyectos:", error);
      results.projects.errors++;
    }

    // 6. Actualizar proyectos donde el usuario es miembro
    try {
      const memberResult = await db.collection("projects").updateMany(
        { "users.email": oldEmail },
        { 
          $set: { 
            "users.$.email": newEmail || oldEmail,
            "users.$.name": newName || oldName
          } 
        }
      );
      results.projects.updated += memberResult.modifiedCount;
    } catch (error) {
      console.error("Error actualizando miembros:", error);
      results.projects.errors++;
    }

    // 7. Actualizar tareas asignadas al usuario
    try {
      const tasksResult = await db.collection("tasks").updateMany(
        { assignedTo: oldEmail },
        { 
          $set: { 
            assignedTo: newEmail || oldEmail,
            assignedToName: newName || oldName
          } 
        }
      );
      results.tasks.updated = tasksResult.modifiedCount;
    } catch (error) {
      console.error("Error actualizando tareas:", error);
      results.tasks.errors++;
    }

    // 8. Actualizar mensajes de chat del usuario
    try {
      const messagesResult = await db.collection("messages").updateMany(
        { user: oldEmail },
        { $set: { user: newEmail || oldEmail } }
      );
      results.messages.updated = messagesResult.modifiedCount;
    } catch (error) {
      console.error("Error actualizando mensajes:", error);
      results.messages.errors++;
    }

    // 9. Devolver resultados
    return res.status(200).json({
      success: true,
      message: 'Datos sincronizados correctamente',
      results
    });

  } catch (error) {
    console.error('Error sincronizando datos:', error);
    return res.status(500).json({ 
      error: 'Error en el servidor',
      message: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
}