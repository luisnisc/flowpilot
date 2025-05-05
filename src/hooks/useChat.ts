import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Definir interfaces para los tipos
interface Message {
  _id?: string;
  projectId: string;
  user: string;
  message: string;
  timestamp: string;
}

interface UseChatReturn {
  messages: Message[];
  connected: boolean;
  sendMessage: (messageText: string) => void;
  isLoading: boolean;
}

export default function useChat(
  projectId: string | undefined,
  user: string | undefined
): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesRef = useRef<Message[]>(messages); // Referencia para acceder al valor más reciente en el callback

  // Actualizar la referencia cuando cambian los mensajes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // Inicializar socket y conectarse al servidor
    const initSocket = async () => {
      try {
        // Asegurarnos de que el servidor socket está listo
        await fetch("/api/socket");

        // Crear conexión con path explícito
        socketRef.current = io({
          path: "/api/socket",
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ["polling", "websocket"],
          timeout: 10000,
        });

        // Configurar eventos
        socketRef.current.on("connect", () => {
          console.log("Conectado al servidor de chat");
          setConnected(true);

          // Unirse a la sala del proyecto
          if (projectId) {
            socketRef.current?.emit("joinProject", projectId);
          }
        });

        // Recibir mensajes anteriores
        socketRef.current.on("previousMessages", (data: Message[]) => {
          setMessages(data);
        });

        // Escuchar nuevos mensajes
        socketRef.current.on("newMessage", (message: Message) => {
          // Verificar si el mensaje ya existe en nuestro estado
          // para evitar duplicados
          setMessages((prevMessages) => {
            // Si el mensaje ya existe (por ID o por contenido+timestamp), no lo añadimos
            const isDuplicate = prevMessages.some(
              (msg) =>
                (msg._id && msg._id === message._id) ||
                (msg.message === message.message &&
                  msg.user === message.user &&
                  msg.timestamp === message.timestamp)
            );

            if (isDuplicate) {
              return prevMessages;
            }

            return [...prevMessages, message];
          });
        });

        // Manejar errores
        socketRef.current.on("error", (error: { message: string }) => {
          console.error("Error en el chat:", error.message);
        });

        // Manejar desconexiones
        socketRef.current.on("disconnect", () => {
          console.log("Desconectado del servidor de chat");
          setConnected(false);
        });
      } catch (error) {
        console.error("Error al inicializar el socket:", error);
        setConnected(false);
      }
    };

    if (projectId && user) {
      initSocket();
    }

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId, user]);

  // Función para enviar mensajes (usando useCallback para evitar recreaciones innecesarias)
  const sendMessage = useCallback(
    (messageText: string) => {
      if (
        !socketRef.current ||
        !connected ||
        !messageText.trim() ||
        isLoading ||
        !projectId ||
        !user
      ) {
        return;
      }

      setIsLoading(true); // Indicar que estamos enviando

      const messageData: Omit<Message, "_id"> = {
        projectId,
        user,
        message: messageText.trim(),
        timestamp: new Date().toISOString(),
      };

      socketRef.current.emit("sendMessage", messageData);

      // No agregamos el mensaje localmente, esperamos a que vuelva del servidor
      // Esto evita la duplicación

      // Terminar el estado de carga después de un breve momento
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    },
    [connected, isLoading, projectId, user]
  );

  return { messages, connected, sendMessage, isLoading };
}
