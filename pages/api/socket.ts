import { Server } from "socket.io";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Socket } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

// Definimos un tipo personalizado para nuestro API response
type SocketServer = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: Server;
    };
  };
};

// Tipado para mensaje
interface Message {
  projectId: string;
  user: string;
  message: string;
  timestamp: string | Date;
  _id?: ObjectId | string;
}

// Tipado para datos del mensaje
interface MessageData {
  projectId: string;
  user: string;
  message: string;
  timestamp: string;
}

export default async function handler(req: NextApiRequest, res: SocketServer) {
  // Si ya existe una conexión socket, no necesitamos crear una nueva
  if (res.socket.server.io) {
    console.log("Socket ya está configurado");
    res.end();
    return;
  }

  try {
    // Configurar Redis 
    const pubClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries:number) => Math.min(retries * 50, 1000),
      },
    });
    const subClient = pubClient.duplicate();

    // Manejar errores de Redis
    pubClient.on("error", (err: Error) => console.error("Redis pub error:", err));
    subClient.on("error", (err: Error) => console.error("Redis sub error:", err));

    // Conectar a Redis
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Configurar Socket.IO con adaptador Redis
    const io = new Server(res.socket.server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "https://flowpilot-58se.vercel.app",
        methods: ["GET", "POST"],
        credentials: true,
      },
      connectionStateRecovery: {
        // Habilitar recuperación de estado de conexión
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
        skipMiddlewares: true,
      },
      // Aumentar tiempo de ping para mantener conexiones vivas
      pingTimeout: 60000,
    });

    // Usar adaptador Redis
    io.adapter(createAdapter(pubClient, subClient));
    res.socket.server.io = io;

    // El resto de tu código para manejar conexiones
    io.on("connection", (socket: Socket) => {
      console.log("Cliente conectado:", socket.id);

      // Unirse a una sala específica para el proyecto
      socket.on("joinProject", async (projectId: string) => {
        socket.join(projectId);
        console.log(`Usuario unido al proyecto: ${projectId}`);

        // Cargar mensajes anteriores del proyecto
        try {
          const client = await clientPromise;
          const db = client.db("app");
          const messages = await db
            .collection("messages")
            .find({ projectId })
            .sort({ timestamp: 1 })
            .limit(50)
            .toArray();

          // Convertir ObjectId a string para serialización JSON
          const serializedMessages = messages.map((msg: any) => ({
            ...msg,
            _id: msg._id.toString(),
          }));

          // Enviar mensajes anteriores al cliente
          socket.emit("previousMessages", serializedMessages);
        } catch (error) {
          console.error("Error cargando mensajes:", error);
          socket.emit("error", { message: "Error cargando mensajes" });
        }
      });

      // Escuchar nuevos mensajes
      socket.on("sendMessage", async (data: MessageData) => {
        const { projectId, user, message, timestamp } = data;

        if (!projectId || !user || !message) {
          socket.emit("error", { message: "Datos de mensaje incompletos" });
          return;
        }

        try {
          // Guardar mensaje en la base de datos
          const client = await clientPromise;
          const db = client.db("app");
          const result = await db.collection("messages").insertOne({
            projectId,
            user,
            message,
            timestamp: new Date(timestamp),
          });

          // Obtener el mensaje con su _id
          const savedMessage: Message = {
            _id: result.insertedId.toString(), // Convertir a string para JSON
            projectId,
            user,
            message,
            timestamp,
          };

          // Emitir el mensaje a todos los usuarios en la sala del proyecto
          io.to(projectId).emit("newMessage", savedMessage);
        } catch (error) {
          console.error(
            "Error guardando mensaje:",
            error instanceof Error ? error.message : "Error desconocido"
          );
          socket.emit("error", { message: "Error al guardar el mensaje" });
        }
      });

      // Manejar desconexión
      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });

    console.log("Socket.IO inicializado con adaptador Redis");
    res.end();
  } catch (error) {
    console.error(
      "Error al configurar Socket.IO:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    res.status(500).end();
  }
}
