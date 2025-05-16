"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Si existe una cuenta con este email, recibirás instrucciones para restablecer tu contraseña.",
        });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Ocurrió un error al procesar la solicitud",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Ocurrió un error al conectar con el servidor",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Recuperar contraseña
      </h1>

      {message && (
        <div
          className={`p-3 rounded mb-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4 ">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa tu dirección de email"
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            Ingresa el email asociado con tu cuenta y te enviaremos un enlace
            para restablecer tu contraseña.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
