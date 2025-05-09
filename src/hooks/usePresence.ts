import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UsePresenceReturn {
  onlineUsers: string[];
  isConnected: boolean;
}

export default function usePresence(
  projectId: string,
  userEmail: string | undefined,
  userName: string | undefined
): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Solo inicializar si tenemos todos los datos necesarios
    if (!projectId || !userEmail) return;

    // Normalizamos el email para consistencia
    const normalizedEmail = userEmail.toLowerCase().trim();

    const initSocket = async () => {
      try {
        console.log(
          "Inicializando socket para presencia, proyecto:",
          projectId
        );

        // Crear socket con el namespace /presence
        if (socketRef.current) {
          // Si ya existe una conexión, desconectarla primero
          socketRef.current.disconnect();
        }

        // IMPORTANTE: Asegúrate que la URL sea correcta y coincida con el servidor
        socketRef.current = io("/presence", {
          // No especificar path aquí, usar el predeterminado /socket.io
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnection: true,
          forceNew: true,
          timeout: 10000,
          transports: ["polling", "websocket"], // Probar primero polling y luego websocket
        });

        // Manejar conexión
        socketRef.current.on("connect", () => {
          console.log("Presence socket conectado:", socketRef.current?.id);
          setIsConnected(true);

          // Notificar que el usuario se ha unido
          socketRef.current?.emit("userJoined", {
            projectId,
            userEmail: normalizedEmail,
            userName,
          });
        });

        // Errores de conexión
        socketRef.current.on("connect_error", (error) => {
          console.error(
            "Presence error de conexión:",
            error instanceof Error ? error.message : String(error)
          );
          setIsConnected(false);
        });

        // Desconexión
        socketRef.current.on("disconnect", (reason) => {
          console.log(`Presence socket desconectado: ${reason}`);
          setIsConnected(false);
        });

        // Recibir actualizaciones de usuarios conectados
        socketRef.current.on("usersOnline", (users: string[]) => {
          console.log("Usuarios conectados actualizados:", users);
          // Asegurar que los usuarios están normalizados
          const normalizedUsers = users.map((u) =>
            typeof u === "string" ? u.toLowerCase().trim() : ""
          );
          setOnlineUsers(normalizedUsers);
        });

        // Configurar heartbeat para mantener la conexión activa
        const heartbeatInterval = setInterval(() => {
          if (socketRef.current?.connected) {
            socketRef.current.emit("heartbeat", {
              userEmail: normalizedEmail,
              projectId,
            });
          }
        }, 20000); // cada 20 segundos

        return () => {
          clearInterval(heartbeatInterval);
        };
      } catch (error) {
        console.error(
          "Error inicializando socket de presencia:",
          error instanceof Error ? error.message : "Error desconocido"
        );
        setIsConnected(false);
      }
    };

    initSocket();

    // Limpieza al desmontar
    return () => {
      console.log("Desconectando socket de presencia");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, userEmail, userName]);

  return {
    onlineUsers,
    isConnected,
  };
}
