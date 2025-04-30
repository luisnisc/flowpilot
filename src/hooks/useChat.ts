import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useChat(projectId, user) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef();
  const messagesRef = useRef(messages); // Referencia para acceder al valor más reciente en el callback

  // Actualizar la referencia cuando cambian los mensajes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // Inicializar socket y conectarse al servidor
    const initSocket = async () => {
      // Asegurarnos de que el servidor socket está listo
      await fetch("/api/socket");

      // Crear conexión
      socketRef.current = io();

      // Configurar eventos
      socketRef.current.on("connect", () => {
        console.log("Conectado al servidor de chat");
        setConnected(true);

        // Unirse a la sala del proyecto
        socketRef.current.emit("joinProject", projectId);
      });

      // Recibir mensajes anteriores
      socketRef.current.on("previousMessages", (data) => {
        setMessages(data);
      });

      // Escuchar nuevos mensajes
      socketRef.current.on("newMessage", (message) => {
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

      // Manejar desconexiones
      socketRef.current.on("disconnect", () => {
        console.log("Desconectado del servidor de chat");
        setConnected(false);
      });
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

  // Función para enviar mensajes
  const sendMessage = (messageText) => {
    if (!socketRef.current || !connected || !messageText.trim() || isLoading)
      return;

    setIsLoading(true); // Indicar que estamos enviando

    const messageData = {
      projectId,
      user: user,
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit("sendMessage", messageData);

    // No agregamos el mensaje localmente, esperamos a que vuelva del servidor
    // Esto evita la duplicación

    // Terminar el estado de carga después de un breve momento
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return { messages, connected, sendMessage, isLoading };
}
