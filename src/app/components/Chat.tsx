"use client";
import { useState, useEffect, useRef } from "react";
import useChat from "@/hooks/useChat";
import { useSession } from "next-auth/react";
import { FaPaperPlane } from "react-icons/fa";
import usePresence from "@/hooks/usePresence";

interface UserInfo {
  displayName: string;
  isOnline: boolean;
  avatar: string;
}

interface UserInfoCache {
  [key: string]: UserInfo;
}

export default function Chat({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userInfoCache, setUserInfoCache] = useState<UserInfoCache>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const pendingUserFetches = useRef<Set<string>>(new Set());

  const userName = session?.user?.name || session?.user?.email || "Usuario";
  const userEmail = session?.user?.email || "";

  const { messages, connected, sendMessage, isLoading } = useChat(projectId);
  const { onlineUsers } = usePresence(projectId, userEmail, userName);

  useEffect(() => {
    const loadUserInfo = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await fetch(`/api/users`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const users = await res.json();
        const cache: UserInfoCache = {};
        users.forEach((user: any) => {
          cache[user.email] = {
            displayName: user.name || user.email || "Usuario",
            isOnline: onlineUsers.includes(user.email),
            avatar:
              user.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name || user.email
              )}&background=random&color=fff&size=32`,
          };
        });

        if (!cache[userEmail]) {
          cache[userEmail] = {
            displayName: userName,
            isOnline: true,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              userName
            )}&background=random&color=fff&size=32`,
          };
        }

        setUserInfoCache(cache);
      } catch (error) {
        console.error("Error al cargar información de usuarios:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUserInfo();
  }, [onlineUsers, userEmail, userName]);

  useEffect(() => {
    setUserInfoCache((prevCache) => {
      const newCache = { ...prevCache };
      Object.keys(newCache).forEach((email) => {
        newCache[email] = {
          ...newCache[email],
          isOnline: onlineUsers.includes(email),
        };
      });
      return newCache;
    });
  }, [onlineUsers]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message, userEmail);
    setMessage("");
  };

  const getUserInfo = (username: string): UserInfo => {
    if (userInfoCache[username]) {
      return userInfoCache[username];
    }

    fetchUserInfoInBackground(username);

    return {
      displayName: username.includes("@") ? username.split("@")[0] : username,
      isOnline: onlineUsers.includes(username),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username
      )}&background=random&color=fff&size=32`,
    };
  };

  const fetchUserInfoInBackground = async (email: string) => {
    if (pendingUserFetches.current.has(email)) return;
    pendingUserFetches.current.add(email);

    try {
      const res = await fetch(
        `/api/users/info?email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const userData = await res.json();

        setUserInfoCache((prev) => ({
          ...prev,
          [email]: {
            displayName:
              userData.name ||
              (email.includes("@") ? email.split("@")[0] : email),
            isOnline: onlineUsers.includes(email),
            avatar:
              userData.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                email
              )}&background=random&color=fff&size=32`,
          },
        }));
      }
    } catch (error) {
      console.error(`Error fetching info for user ${email}:`, error);
    } finally {
      pendingUserFetches.current.delete(email);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">Chat del proyecto</h2>
        <div className="flex items-center">
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-sm">
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading || isLoadingUsers ? (
          <div className="flex flex-col space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-12 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.user === userEmail;
            const userInfo = getUserInfo(msg.user);

            const timestamp =
              typeof msg.timestamp === "string"
                ? new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : (msg.timestamp as Date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

            return (
              <div
                key={msg._id || `temp-${index}`}
                className={`flex items-start break-words ${
                  isCurrentUser ? "justify-end" : ""
                }`}
              >
                {!isCurrentUser && (
                  <div className="relative flex-shrink-0 mr-2">
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                        userInfo.isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {!isCurrentUser && (
                    <div className="font-medium text-xs mb-1 flex items-center">
                      {userInfo.displayName}
                      {userInfo.isOnline && (
                        <span className="ml-1.5 text-xs font-normal text-green-600">
                          • en línea
                        </span>
                      )}
                    </div>
                  )}
                  <div>{msg.message}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isCurrentUser ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {timestamp}
                  </div>
                </div>

                {isCurrentUser && (
                  <div className="relative flex-shrink-0 ml-2">
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full bg-green-500"></span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 border rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!connected}
        />
        <button
          title="Enviar mensaje"
          type="submit"
          className={`px-4 py-2 rounded-r-md ${
            connected
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          } transition-colors`}
          disabled={!connected || !message.trim()}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
