import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface Message {
  _id?: string;
  projectId: string;
  user: string;
  message: string;
  timestamp: string | Date;
}

export interface UseChatReturn {
  messages: Message[];
  connected: boolean;
  sendMessage: (message: string, user: string) => void;
  isLoading: boolean;
}

export default function useChat(projectId: string | undefined): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const initSocket = async () => {
      try {
        console.log("Inicializando socket para chat, proyecto:", projectId);
        setIsLoading(true); 

        try {
          await fetch("/api/socket");
        } catch (error) {
          console.error("Error verificando API socket:", error);
        }

        socketRef.current = io("/chat", {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ["polling", "websocket"],
        });

        socketRef.current.on("connect", () => {
          console.log("Chat socket conectado:", socketRef.current?.id);
          setConnected(true);

          socketRef.current?.emit("joinProject", projectId);
          console.log(`Emitido joinProject para: ${projectId}`);
        });

        socketRef.current.on("connect_error", (error) => {
          console.error(
            "Chat error de conexión:",
            error instanceof Error ? error.message : String(error)
          );
          setConnected(false);
          setIsLoading(false); 
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log(`Chat socket desconectado: ${reason}`);
          setConnected(false);
        });

        socketRef.current.on("previousMessages", (data: Message[]) => {
          console.log("Mensajes previos recibidos:", data.length);
          setMessages(data || []); 
          setIsLoading(false); 
        });

        socketRef.current.on("newMessage", (message: Message) => {
          console.log("Nuevo mensaje recibido:", message);
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) =>
                (msg._id && msg._id === message._id) ||
                (msg.message === message.message &&
                  msg.user === message.user &&
                  msg.timestamp === message.timestamp)
            );
            return isDuplicate ? prev : [...prev, message];
          });
          setIsLoading(false); 
        });

        socketRef.current.on("error", (error) => {
          console.error("Error de chat:", error);
          setIsLoading(false);
        });

        setTimeout(() => {
          if (isLoading) {
            console.log("Timeout de carga de mensajes, forzando fin de carga");
            setIsLoading(false);
          }
        }, 5000);
      } catch (error) {
        console.error("Error inicializando chat socket:", error);
        setConnected(false);
        setIsLoading(false); 
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        console.log("Desconectando chat socket");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId]);

  const sendMessage = (messageText: string, user: string) => {
    if (!messageText.trim() || !socketRef.current || !connected || !projectId) {
      console.error("No se puede enviar mensaje - condiciones no cumplidas");
      return;
    }

    const timestamp = new Date().toISOString();

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      projectId,
      user,
      message: messageText.trim(),
      timestamp,
    };

    setMessages((prev) => [...prev, tempMessage]);

    socketRef.current.emit("sendMessage", {
      projectId,
      user,
      message: messageText.trim(),
      timestamp,
    });
  };

  return {
    messages,
    connected,
    sendMessage,
    isLoading,
  };
}
