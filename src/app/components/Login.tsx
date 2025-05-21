"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

interface LoginProps {
  callbackUrl?: string;
}
export default function Login({ callbackUrl }: LoginProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams?.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    registered
      ? "Cuenta creada correctamente. Inicia sesión para continuar."
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (session) {
    router.push("/dashboard");
    return null;
  }

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error de conexión. Comprueba tu internet.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-w-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="p-8 rounded-lg shadow-xl bg-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-50"></div>
          <p className="mt-6 text-gray-700 font-medium">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-black">
      <div className="m-auto w-full max-w-md p-8 rounded-xl shadow-xl bg-white">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="mt-2 text-gray-600">
            Accede a tu cuenta y gestiona tus proyectos
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleCredentials} className="space-y-5">
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
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FiEyeOff className="w-5 h-5" />
              ) : (
                <FiEye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setLoading(true);
              signIn("google", { callbackUrl: "/dashboard" });
            }}
            className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Image
              src="/google.svg"
              width={20}
              height={20}
              alt="Google"
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>

          <button
            onClick={() => {
              setLoading(true);
              signIn("github", { callbackUrl: "/dashboard" });
            }}
            className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Image
              src="/github_light.svg"
              width={20}
              height={20}
              alt="GitHub"
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">GitHub</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
