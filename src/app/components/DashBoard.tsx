"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SideBar from "./SideBar";

export default function DashBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-0 m-4">
        <button
          onClick={() =>
            signOut({ callbackUrl: "http://localhost:3000/login" })
          }
          className="btn btn-primary"
        >
          Logout
        </button>
      </div>
      <SideBar />
      <main className="flex flex-col h-screen bg-gray-200 text-black ml-[19.66667%]">
        <div>
          <h1 className="text-black text-5xl text-center mt-10">
            Bienvenido a FlowPilot
          </h1>
        </div>
        <div className="h-screen bg-gray-200 text-black grid grid-cols-2 gap-4 p-10">
          <div id="tareasAsignadas" className="flex flex-col items-center">
            <h3 className="text-xl font-bold text-center mt-10">
              Tareas Asignadas
            </h3>
            <div className="flex flex-col items-center justify-center mt-10 border h-96 w-full bg-white rounded-lg shadow-lg">
              <p className="text-lg"></p>
            </div>
          </div>
          <div id="proyectosActuales" className="flex flex-col items-center">
            <h3 className="text-xl font-bold mt-10">Proyectos Actuales</h3>
            <div className="flex flex-col items-center justify-center mt-10 border h-96 w-full bg-white rounded-lg shadow-lg">
              <p className="text-lg"></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
