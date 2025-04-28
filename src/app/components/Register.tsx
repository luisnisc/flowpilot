"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [data, setData] = useState({ email: "", name: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/login");
    } else {
      const { error } = await res.json();
      setError(error);
    }
  };

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
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            required
          />
          <input
            name="name"
            type="text"
            placeholder="Nombre de usuario"
            className="input mb-4"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            className="input mb-4"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            required
          />
          <button type="submit" className="btn btn-primary mb-4">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}