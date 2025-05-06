
import { Server } from "socket.io";
import { getServerSession } from "next-auth/next";
import authOptions  from "./auth/[...nextauth]"; 
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Socket } from "socket.io";

type SocketServer = NextApiResponse & {
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

export default async function handler(req: NextApiRequest, res: SocketServer) {
  if (res.socket.server.io) {
    console.log("Socket ya está configurado");
    res.end();
    return;
  }

  try {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket: Socket) => {
      console.log("Cliente conectado:", socket.id);

      socket.on("joinProject", async (projectId: string) => {
        socket.join(projectId);
        console.log(`Usuario unido al proyecto: ${projectId}`);

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
        } catch (error) {
          console.error("Error cargando mensajes:", error);
          socket.emit("error", { message: "Error cargando mensajes" });
        }
      });

      socket.on("sendMessage", async (data: MessageData) => {
        const { projectId, user, message, timestamp } = data;

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

          io.to(projectId).emit("newMessage", savedMessage);
        } catch (error) {
          console.error(
            "Error guardando mensaje:",
            error instanceof Error ? error.message : "Error desconocido"
          );
          socket.emit("error", { message: "Error al guardar el mensaje" });
        }
      });

      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });

    res.end();
  } catch (error) {
    console.error(
      "Error al configurar Socket.IO:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    res.status(500).end();
  }
}
