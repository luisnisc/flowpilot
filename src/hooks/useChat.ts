import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
  const messagesRef = useRef<Message[]>(messages);
  const [usePolling, setUsePolling] = useState<boolean>(false);
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  
  useEffect(() => {
    if (isVercel) {
      setUsePolling(true);
    }
  }, [isVercel]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!projectId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/messages?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    let pollingInterval: NodeJS.Timeout | null = null;
    
    if (usePolling && projectId) {
      pollingInterval = setInterval(async () => {
        try {
          const lastTimestamp = messagesRef.current.length > 0 
            ? messagesRef.current[messagesRef.current.length - 1].timestamp 
            : '';
          
          const response = await fetch(
            `/api/messages?projectId=${projectId}&after=${encodeURIComponent(lastTimestamp)}`
          );
          
          if (response.ok) {
            const newMessages = await response.json();
            if (newMessages.length > 0) {
              setMessages(prevMessages => [...prevMessages, ...newMessages]);
            }
          }
        } catch (error) {
          console.error("Error polling messages:", error);
        }
      }, 3000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [projectId, usePolling]);

  useEffect(() => {
    if (usePolling || !projectId || !user) return;

    const initSocket = async () => {
      try {
        await fetch("/api/socket");

        socketRef.current = io("/", {  
          path: "/api/socket",
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ["polling", "websocket"],
          timeout: 10000,
        });

        socketRef.current.on("connect", () => {
          console.log("Conectado al servidor de chat");
          setConnected(true);

          if (projectId) {
            socketRef.current?.emit("joinProject", projectId);
          }
        });

        socketRef.current.on("previousMessages", (data: Message[]) => {
          setMessages(data);
        });

        socketRef.current.on("newMessage", (message: Message) => {
          setMessages((prevMessages) => {
            const isDuplicate = prevMessages.some(
              (msg) => (msg._id && msg._id === message._id) ||
                (msg.message === message.message && msg.user === message.user && msg.timestamp === message.timestamp)
            );
            return isDuplicate ? prevMessages : [...prevMessages, message];
          });
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Error conectando al socket:", error.message);
          setUsePolling(true); 
          setConnected(false);
        });

        socketRef.current.on("disconnect", () => {
          console.log("Desconectado del servidor de chat");
          setConnected(false);
        });
      } catch (error) {
        console.error("Error al inicializar el socket:", error);
        setConnected(false);
        setUsePolling(true);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId, user, usePolling]);

  
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading || !projectId || !user) {
        return;
      }

      setIsLoading(true);

      const messageData = {
        projectId,
        user,
        message: messageText.trim(),
        timestamp: new Date().toISOString(),
      };

      try {

        const tempId = `temp-${Date.now()}`;
        
        setMessages(prev => [...prev, { ...messageData, _id: tempId }]);

        if (usePolling || !connected || !socketRef.current) {

          const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messageData),
          });

          if (!response.ok) {
            throw new Error("Error enviando mensaje");
          }

          const savedMessage = await response.json();
          
          setMessages(prev => prev.map(msg => 
            msg._id === tempId ? savedMessage : msg
          ));
        } else {
          socketRef.current.emit("sendMessage", messageData);
        }
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        
        setMessages(prev => 
          prev.filter(msg => !msg._id?.startsWith('temp-'))
        );
        
        alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
    },
    [connected, isLoading, projectId, user, usePolling]
  );

  return { 
    messages, 
    connected: usePolling || connected, 
    sendMessage, 
    isLoading 
  };
}
