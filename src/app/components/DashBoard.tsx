"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SideBar from "./SideBar";

export default function DashBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Cargando...</div>;
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
        <h1 className="text-black text-5xl text-center mt-10">Bienvenido a FlowPilot</h1>
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
          <h3 className="text-xl font-bold mt-10">
            Proyectos Actuales
          </h3>
          <div className="flex flex-col items-center justify-center mt-10 border h-96 w-full bg-white rounded-lg shadow-lg">
            <p className="text-lg"></p>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
