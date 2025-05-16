"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.error || "Error al registrar. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("Error de conexión. Comprueba tu internet.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="p-8 rounded-lg shadow-xl bg-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-50"></div>
          <p className="mt-6 text-gray-700 font-medium">Procesando tu registro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-black">
      <div className="m-auto w-full max-w-md p-8 rounded-xl shadow-xl bg-white">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="mt-2 text-gray-600">Únete a FlowPilot y empieza a gestionar tus proyectos</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <FiMail className="w-5 h-5" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Correo electrónico"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <FiUser className="w-5 h-5" />
            </div>
            <input
              name="name"
              type="text"
              placeholder="Nombre de usuario"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <FiLock className="w-5 h-5" />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <FiLock className="w-5 h-5" />
            </div>
            <input
              name="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              placeholder="Confirmar contraseña"
              className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            >
              {showPasswordConfirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Crear cuenta"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}