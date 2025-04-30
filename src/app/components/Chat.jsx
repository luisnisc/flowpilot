"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import useChat from "../../hooks/useChat";
import { FiSend } from "react-icons/fi";

export default function Chat({ projectId }) {
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const { messages, connected, sendMessage } = useChat(
    projectId,
    session?.user?.email
  );

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  // Formatear la fecha y hora para mostrar
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="font-bold text-xl text-gray-800">Chat del proyecto</h2>
        <div
          className={`text-xs ${connected ? "text-green-500" : "text-red-500"}`}
        >
          {connected ? "Conectado" : "Desconectado"}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 italic">
            No hay mensajes aún. ¡Sé el primero en escribir!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`flex ${
                msg.user === session?.user?.email
                  ? "justify-end"
                  : "justify-start"
              } items-start`}
            >
              {/* Avatar para mensajes de otros usuarios (mostrado a la izquierda) */}
              {msg.user !== session?.user?.email && (
                <div className="mr-2 flex-shrink-0">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      msg.user
                    )}&background=random&color=fff&size=32`}
                    alt={`Avatar de ${msg.user}`}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg p-3 break-words ${
                  msg.user === session?.user?.email
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {msg.user !== session?.user?.email && (
                  <div className="text-xs font-bold mb-1">{msg.user}</div>
                )}
                <div>{msg.message}</div>
                <div className="text-xs text-right mt-1 opacity-70">
                  {formatTime(msg.timestamp)}
                </div>
              </div>

              {/* Avatar para los mensajes propios (mostrado a la derecha) */}
              {msg.user === session?.user?.email && (
                <div className="ml-2 flex-shrink-0">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      msg.user
                    )}&background=random&color=fff&size=32`}
                    alt="Tu avatar"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-3 flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={!connected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!connected || !newMessage.trim()}
        >
          <FiSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
