"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FaPaperPlane } from "react-icons/fa";
import { io } from "socket.io-client";

interface Message {
  _id: string;
  projectId: string;
  user: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  projectId: string;
}

export default function Chat({ projectId }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Cargar mensajes iniciales y configurar WebSocket
  useEffect(() => {
    fetchMessages();
    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId]);

  // Scrollear al último mensaje cuando se añaden nuevos mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const setupWebSocket = async () => {
    try {
      // Asegurarse de que el servidor socket está listo
      await fetch("/api/socket");

      // Crear conexión
      socketRef.current = io();

      // Configurar eventos
      socketRef.current.on("connect", () => {
        console.log("Chat conectado al servidor de WebSockets");
        setConnected(true);

        // Unirse a la sala de chat del proyecto
        socketRef.current.emit("joinProject", projectId);
      });

      // Escuchar nuevos mensajes
      socketRef.current.on("newMessage", (message: Message) => {
        console.log("Nuevo mensaje recibido:", message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      // Manejar desconexiones
      socketRef.current.on("disconnect", () => {
        console.log("Chat desconectado del servidor");
        setConnected(false);
      });
    } catch (error) {
      console.error("Error al inicializar el WebSocket para el chat:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);

      console.log(`Fetching messages for project: ${projectId}`);
      const res = await fetch(`/api/messages?projectId=${projectId}`);

      if (!res.ok) {
        const errorText = await res.text().catch(() => null);
        console.error(`API error (${res.status}): ${errorText || res.statusText}`);
        throw new Error(`Error ${res.status}: ${errorText || "Could not fetch messages"}`);
      }

      const data = await res.json();
      console.log(`Fetched ${data.length} messages`);
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
      // Even if there's an error, we still want to allow the user to send messages
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !session?.user?.email) return;

    try {
      // Crear el objeto mensaje
      const messageData = {
        projectId,
        user: session.user.email,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      // Guardar en la base de datos
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const savedMessage = await res.json();

      // Enviar mensaje vía WebSocket si está conectado
      if (socketRef.current && connected) {
        socketRef.current.emit("sendMessage", savedMessage);
      } else {
        // Si no está conectado, actualizamos la UI localmente
        setMessages((prevMessages) => [...prevMessages, savedMessage]);
      }

      // Limpiar campo de entrada
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 md:p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 md:p-6 border-b flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-800">Chat del Proyecto</h2>
        <div className="flex items-center">
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-xs text-gray-500">
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[40vh]">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay mensajes aún.</p>
            <p>¡Sé el primero en escribir algo!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${
                session?.user?.email === msg.user
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  session?.user?.email === msg.user
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="flex justify-between items-baseline mb-1 text-xs">
                  <span
                    className={
                      session?.user?.email === msg.user
                        ? "text-blue-100"
                        : "text-gray-500"
                    }
                  >
                    {msg.user}
                  </span>
                  <span
                    className={`ml-2 ${
                      session?.user?.email === msg.user
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
                <p className="break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de envío */}
      <form
        onSubmit={sendMessage}
        className="border-t p-4 flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          className="flex-grow border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !connected}
          className={`bg-blue-600 text-white rounded-lg p-2 ${
            !newMessage.trim() || !connected
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-700"
          }`}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
