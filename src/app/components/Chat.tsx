"use client";
import { useState, useEffect, useRef } from "react";
import useChat from "@/hooks/useChat";
import { useSession } from "next-auth/react";
import { FaPaperPlane } from "react-icons/fa";

export default function Chat({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Usar nombre de usuario o email como fallback
  const userName = session?.user?.name || session?.user?.email || "Usuario";

  // Obtener chat con ID de proyecto
  const { messages, connected, sendMessage, isLoading } = useChat(projectId);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message, userName);
    setMessage("");
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
        {isLoading ? (
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
            const isCurrentUser = msg.user === userName;
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
                className={`flex ${isCurrentUser ? "justify-end" : ""}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {!isCurrentUser && (
                    <div className="font-medium text-xs mb-1">{msg.user}</div>
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
          disabled={!connected}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
