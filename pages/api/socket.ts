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

type SocketServer = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: Server;
    };
  };
};

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

export default async function handler(req: NextApiRequest, res: SocketServer) {
  // Verificar si Socket.IO ya está inicializado
  if (res.socket.server.io) {
    console.log("Socket.IO ya está inicializado");
    res.status(200).json({ ok: true, status: "Socket.IO ya inicializado" });
    return;
  }

  try {
    console.log("Configurando Socket.IO...");

    // Configuración importante: Socket.IO debe usar el path exacto /socket.io
    const io = new Server(res.socket.server, {
      // NO configurar path aquí - usar path por defecto /socket.io
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

    // Guardar la instancia en el servidor
    res.socket.server.io = io;

    console.log("Socket.IO inicializado correctamente");

    // Configurar namespace para chat
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

          // Emitir a todos en el proyecto
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

    // Configurar namespace para tablero kanban
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

          // Emitir a todos en la sala
          kanbanNamespace.to(roomName).emit("taskUpdated", task);

          // Confirmar al emisor
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
