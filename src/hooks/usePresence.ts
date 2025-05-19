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
    if (!projectId || !userEmail) return;

    const normalizedEmail = userEmail.toLowerCase().trim();

    const initSocket = async () => {
      try {
        console.log(
          "Inicializando socket para presencia, proyecto:",
          projectId
        );

        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        socketRef.current = io("/presence", {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnection: true,
          forceNew: true,
          timeout: 10000,
          transports: ["polling", "websocket"],
        });

        socketRef.current.on("connect", () => {
          console.log("Presence socket conectado:", socketRef.current?.id);
          setIsConnected(true);

          socketRef.current?.emit("userJoined", {
            projectId,
            userEmail: normalizedEmail,
            userName,
          });
        });

        socketRef.current.on("connect_error", (error) => {
          console.error(
            "Presence error de conexión:",
            error instanceof Error ? error.message : String(error)
          );
          setIsConnected(false);
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log(`Presence socket desconectado: ${reason}`);
          setIsConnected(false);
        });

        socketRef.current.on("usersOnline", (users: string[]) => {
          console.log("Usuarios conectados actualizados:", users);
          const normalizedUsers = users.map((u) =>
            typeof u === "string" ? u.toLowerCase().trim() : ""
          );
          setOnlineUsers(normalizedUsers);
        });

        const heartbeatInterval = setInterval(() => {
          if (socketRef.current?.connected) {
            socketRef.current.emit("heartbeat", {
              userEmail: normalizedEmail,
              projectId,
            });
          }
        }, 20000); 

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
