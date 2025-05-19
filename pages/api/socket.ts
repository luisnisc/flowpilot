import { Server } from "socket.io";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Socket } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};
export interface NextApiRequestWithSocket
  extends Omit<NextApiRequest, "socket"> {
  socket: {
    server: NetServer & {
      io?: Server;
    };
  };
}

export interface NextApiResponseWithSocket
  extends Omit<NextApiResponse, "socket"> {
  socket: {
    server: NetServer & {
      io?: Server;
    };
  };
}

interface Message {
  projectId: string;
  user: string;
  message: string;
  timestamp: string | Date;
  _id?: ObjectId | string;
}

interface MessageData {
  projectId: string;
  user: string;
  message: string;
  timestamp: string;
}

interface TaskUpdateData {
  projectId: string;
  task: any;
}

const connectedUsers: Record<string, Set<string>> = {};

export default async function handler(
  req: NextApiRequestWithSocket,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    console.log("Socket ya inicializado");
    res.end();
    return;
  }

  try {
    console.log("Configurando Socket.IO...");

    const io = new Server(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
      },
      connectTimeout: 20000,
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["polling", "websocket"],
    });

    res.socket.server.io = io;

    console.log("Socket.IO inicializado correctamente");

    const chatNamespace = io.of("/chat");

    chatNamespace.on("connection", (socket: Socket) => {
      console.log(`🗨️ Chat cliente conectado: ${socket.id}`);

      socket.on("joinProject", async (projectId: string) => {
        socket.join(projectId);
        console.log(`👤 Usuario ${socket.id} unido al chat: ${projectId}`);

        try {
          const client = await clientPromise;
          const db = client.db("app");
          const messages = await db
            .collection("messages")
            .find({ projectId })
            .sort({ timestamp: 1 })
            .limit(50)
            .toArray();

          const serializedMessages = messages.map((msg: any) => ({
            ...msg,
            _id: msg._id.toString(),
          }));

          socket.emit("previousMessages", serializedMessages);
          console.log(
            `Enviados ${serializedMessages.length} mensajes a ${socket.id}`
          );
        } catch (error) {
          console.error("Error cargando mensajes:", error);
          socket.emit("error", { message: "Error cargando mensajes" });
        }
      });

      socket.on("sendMessage", async (data: MessageData) => {
        const { projectId, user, message, timestamp } = data;
        console.log(
          `📝 Mensaje recibido de ${user} para proyecto ${projectId}`
        );

        if (!projectId || !user || !message) {
          socket.emit("error", { message: "Datos de mensaje incompletos" });
          return;
        }

        try {
          const client = await clientPromise;
          const db = client.db("app");
          const result = await db.collection("messages").insertOne({
            projectId,
            user,
            message,
            timestamp: new Date(timestamp),
          });

          const savedMessage: Message = {
            _id: result.insertedId.toString(),
            projectId,
            user,
            message,
            timestamp,
          };

          chatNamespace.to(projectId).emit("newMessage", savedMessage);
          console.log(`Mensaje enviado a sala ${projectId}`);
        } catch (error) {
          console.error("Error guardando mensaje:", error);
          socket.emit("error", { message: "Error al guardar el mensaje" });
        }
      });

      socket.on("error", (error) => {
        console.error("Error en socket chat:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log(
          `Chat cliente desconectado: ${socket.id}, razón: ${reason}`
        );
      });
    });

    const kanbanNamespace = io.of("/kanban");

    kanbanNamespace.on("connection", (socket: Socket) => {
      console.log(`🎲 Kanban cliente conectado: ${socket.id}`);

      socket.on("joinProjectSync", (projectId: string) => {
        const roomName = `sync-${projectId}`;
        socket.join(roomName);
        console.log(
          `🔄 Usuario ${socket.id} unido a sincronización: ${roomName}`
        );
        socket.emit("joined", { success: true, room: roomName });
      });

      socket.on("updateTask", (data: TaskUpdateData) => {
        try {
          const { projectId, task } = data;

          if (!projectId || !task) {
            socket.emit("error", { message: "Datos incompletos" });
            return;
          }

          const roomName = `sync-${projectId}`;
          console.log(`📋 Actualización de tarea en ${roomName}:`, task.id);

          kanbanNamespace.to(roomName).emit("taskUpdated", task);

          socket.emit("taskUpdateConfirmed", { taskId: task.id });
        } catch (error) {
          console.error("Error en updateTask:", error);
          socket.emit("error", {
            message: "Error procesando actualización de tarea",
          });
        }
      });

      socket.on("error", (error) => {
        console.error("Error en socket kanban:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log(
          `Kanban cliente desconectado: ${socket.id}, razón: ${reason}`
        );
      });
    });

    const presenceNamespace = io.of("/presence");

    presenceNamespace.on("connection", (socket: Socket) => {
      console.log(`👥 Presence cliente conectado: ${socket.id}`);
      let currentUserEmail: string | null = null;
      let currentProjectId: string | null = null;

      socket.on("userJoined", ({ projectId, userEmail, userName }) => {
        if (!projectId || !userEmail) return;

        currentUserEmail = userEmail.toLowerCase().trim();
        currentProjectId = projectId;

        console.log(
          `👤 Usuario ${currentUserEmail} conectado al proyecto ${projectId}`
        );

        if (!connectedUsers[projectId]) {
          connectedUsers[projectId] = new Set();
        }

        if (currentUserEmail) {
          connectedUsers[projectId].add(currentUserEmail);
        }

        const usersInProject = Array.from(connectedUsers[projectId]);
        console.log(
          `🔄 Emitiendo usersOnline con: ${usersInProject.length} usuarios`
        );

        socket.emit("usersOnline", usersInProject);

        socket.to(projectId).emit("usersOnline", usersInProject);

        socket.join(projectId);
      });

      socket.on("heartbeat", ({ userEmail, projectId }) => {
        if (
          userEmail &&
          projectId &&
          connectedUsers[projectId]?.has(userEmail)
        ) {
          console.log(
            `💓 Heartbeat recibido de ${userEmail} en proyecto ${projectId}`
          );
        }
      });

      socket.on("disconnect", () => {
        if (
          currentProjectId &&
          currentUserEmail &&
          connectedUsers[currentProjectId]
        ) {
          connectedUsers[currentProjectId].delete(currentUserEmail);

          const usersInProject = Array.from(connectedUsers[currentProjectId]);
          presenceNamespace
            .to(currentProjectId)
            .emit("usersOnline", usersInProject);

          console.log(
            `👋 Usuario ${currentUserEmail} desconectado del proyecto ${currentProjectId}`
          );
          console.log(
            `🔄 Usuarios restantes en proyecto ${currentProjectId}:`,
            usersInProject
          );

          if (connectedUsers[currentProjectId].size === 0) {
            delete connectedUsers[currentProjectId];
          }
        }
      });
    });

    console.log("✅ Socket.IO configurado correctamente con namespaces");
    res
      .status(200)
      .json({ ok: true, status: "Socket.IO inicializado correctamente" });
  } catch (error) {
    console.error(
      "Error al configurar Socket.IO:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    res.status(500).json({ ok: false, error: "Error configurando Socket.IO" });
  }
}
