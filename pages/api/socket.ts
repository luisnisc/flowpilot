import { Server } from 'socket.io';
import { getServerSession } from "next-auth/next";
import NextAuthOptions from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Si ya existe una conexión socket, no necesitamos crear una nueva
  if (res.socket.server.io) {
    console.log('Socket ya está configurado');
    res.end();
    return;
  }

  // Configurar Socket.IO
  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  // Manejar eventos de socket
  io.on('connection', async (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Unirse a una sala específica para el proyecto
    socket.on('joinProject', async (projectId) => {
      socket.join(projectId);
      console.log(`Usuario unido al proyecto: ${projectId}`);
      
      // Cargar mensajes anteriores del proyecto
      try {
        const client = await clientPromise;
        const db = client.db("app");
        const messages = await db.collection("messages")
          .find({ projectId })
          .sort({ timestamp: 1 })
          .limit(50)
          .toArray();
        
        // Enviar mensajes anteriores al cliente
        socket.emit('previousMessages', messages);
      } catch (error) {
        console.error('Error cargando mensajes:', error);
      }
    });

    // Escuchar nuevos mensajes
    socket.on('sendMessage', async (data) => {
      const { projectId, user, message, timestamp } = data;
      
      try {
        // Guardar mensaje en la base de datos
        const client = await clientPromise;
        const db = client.db("app");
        const result = await db.collection("messages").insertOne({
          projectId,
          user,
          message,
          timestamp: new Date(timestamp)
        });
        
        // Obtener el mensaje con su _id
        const savedMessage = {
          _id: result.insertedId,
          projectId,
          user,
          message,
          timestamp
        };
        
        // Emitir el mensaje a todos los usuarios en la sala del proyecto
        io.to(projectId).emit('newMessage', savedMessage);
      } catch (error) {
        console.error('Error guardando mensaje:', error);
      }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  res.end();
}