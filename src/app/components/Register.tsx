"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login");
    } else {
      const { error } = await res.json();
      setError(error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Procesando registro...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
      <div className="flex flex-col items-center justify-center h-96 w-max px-4 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-black">Registro</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            name="email"
            type="email"
            placeholder="Correo"
            className="input mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            name="name"
            type="text"
            placeholder="Nombre de usuario"
            className="input mb-4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            className="input mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            name="passwordConfirm"
            type="password"
            placeholder="Confirmar Contraseña"
            className="input mb-4"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn btn-primary mb-4"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
