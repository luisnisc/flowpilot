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
  const [sending, setSending] = useState(false);
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

      // Escuchar mensajes previos (históricos)
      socketRef.current.on(
        "previousMessages",
        (previousMessages: Message[]) => {
          console.log("Mensajes previos recibidos:", previousMessages.length);
          setMessages(previousMessages);
          setLoading(false);
        }
      );

      // Escuchar nuevos mensajes
      socketRef.current.on("newMessage", (message: Message) => {
        console.log("Nuevo mensaje recibido:", message);
        // Asegurarse de no añadir duplicados verificando el ID
        setMessages((prevMessages) => {
          // Verificar si este mensaje ya existe en la lista
          const messageExists = prevMessages.some(
            (m) =>
              m._id === message._id ||
              (m.user === message.user &&
                m.message === message.message &&
                m.timestamp === message.timestamp)
          );

          if (messageExists) {
            return prevMessages;
          }

          return [...prevMessages, message];
        });

        // Si estamos esperando respuesta de un mensaje enviado, actualizar el estado
        if (sending) {
          setSending(false);
        }
      });

      // Manejar desconexiones
      socketRef.current.on("disconnect", () => {
        console.log("Chat desconectado del servidor");
        setConnected(false);
      });
    } catch (error) {
      console.error("Error al inicializar el WebSocket para el chat:", error);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      // Ya no necesitamos cargar mensajes por HTTP, los obtendremos vía WebSocket
      // Este método ahora está principalmente para gestionar el estado de carga inicial
      setLoading(true);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !session?.user?.email || sending) return;

    try {
      // Indicar que estamos enviando un mensaje
      setSending(true);

      // Crear el objeto mensaje
      const messageData = {
        projectId,
        user: session.user.email,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      // Limpiar campo de entrada inmediatamente para mejor UX
      setNewMessage("");

      // Enviar mensaje vía WebSocket
      if (socketRef.current && connected) {
        // Simplemente enviar al servidor y esperar la confirmación
        socketRef.current.emit("sendMessage", messageData);

        // Añadir un temporizador de seguridad para restablecer el estado
        // en caso de que no recibamos confirmación del servidor
        setTimeout(() => {
          setSending(false);
        }, 3000); // 3 segundos de tiempo máximo de espera
      } else {
        console.error("No se pudo enviar el mensaje: Socket no conectado");
        setSending(false);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setSending(false);
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

  if (loading && !messages.length) {
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
                    {msg.user.split("@")[0]}
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
          placeholder={connected ? "Escribe un mensaje..." : "Conectando..."}
          className="flex-grow border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={!connected || sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !connected || sending}
          className={`bg-blue-600 text-white rounded-lg p-2 ${
            !newMessage.trim() || !connected || sending
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-700"
          }`}
        >
          {sending ? (
            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  );
}
