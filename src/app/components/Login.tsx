"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if(session) {
    router.push("/dashboard");
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) setError(res.error);
    else router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Iniciando sesión...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
      <div className="flex flex-col items-center justify-center h-96 w-max pr-4 pl-4 bg-white rounded-2xl">
        <h1 className="text-3xl font-bold mb-4 text-black">Iniciar Sesión</h1>
        {error && (
          <div className="alert alert-error shadow-lg mb-4">
            <div>
              <span>{error}</span>
            </div>
          </div>
        )}
        <form
          onSubmit={handleCredentials}
          className="flex flex-col items-center"
        >
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="input mb-4"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="input mb-4"
            required
          />
          <button type="submit" className="btn btn-primary mb-4">
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>
        <div className="flex flex-row items-center gap-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="btn flex items-center"
          >
            <Image src="/google.svg" width={20} height={20} alt="Google" />
            &nbsp;Google
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="btn flex items-center"
          >
            <Image src="/github_dark.svg" width={20} height={20} alt="GitHub" />
            &nbsp;GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
