"use client";
import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) setError(res.error);
    else router.push("/dashboard");
  };



  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
      <div className="flex flex-col items-center justify-center h-96 w-max pr-4 pl-4 bg-white rounded-2xl">
        <h1 className="text-3xl font-bold mb-4 text-black">Iniciar Sesión</h1>
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
            Iniciar Sesión
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
