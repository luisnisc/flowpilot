"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { unstable_ViewTransition as ViewTransition } from "react";
import SideBar from "./SideBar";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  description: string;
  tasks?: string[];
  users?: string[];
  status?: "active" | "completed" | "on_hold" | "canceled" | "in-progress";
}

export default function Projects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      setIsAdmin(true);
    }
  }, [session?.user?.role]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data: Project[] = await res.json();

      if (session?.user?.role === "admin") {
        setProjects(data);
      } else {
        const userProjects = data.filter(
          (project) =>
            project.users?.includes(session?.user?.email || "") ||
            project.users?.includes(session?.user?.name || "")
        );
        setProjects(userProjects);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Cargando proyectos...</p>
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
      <SideBar />
      <main className="flex flex-col bg-gray-200 text-black md:ml-[16.66667%] h-max">
        <div className="flex flex-col md:h-screen h-full bg-gray-200 text-black p-6 ">
          <h1 className="text-3xl font-bold mb-6 md:mt-0 mt-10">Proyectos</h1>
          {isAdmin && (
            <Link href="/addProject">
              <button className="btn btn-primary mb-4">Crear Proyecto</button>
            </Link>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((project) => (
                <Link
                  href={`/projects/${project._id}`}
                  key={project._id}
                  passHref
                >
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-semibold mb-2">
                      {project.name}
                    </h2>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    {project.status && (
                      <div className="flex items-center mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                            project.status === "active"
                              ? "bg-green-100 text-green-800"
                              : project.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : project.status === "on_hold"
                              ? "bg-yellow-100 text-yellow-800"
                              : 
                                project.status === "canceled"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-1.5 ${
                              project.status === "active"
                                ? "bg-green-600"
                                : project.status === "completed"
                                ? "bg-blue-600"
                                : project.status === "on_hold"
                                ? "bg-yellow-600"
                                :
                                  project.status === "canceled"
                                ? "bg-gray-600"
                                : "bg-purple-600"
                            }`}
                          ></span>
                          {project.status === "active"
                            ? "Activo"
                            : project.status === "completed"
                            ? "Completado"
                            : project.status === "on_hold"
                            ? "En espera"
                            : project.status === "canceled"
                            ? "Cancelado"
                            : project.status === "in-progress"
                            ? "En progreso"
                            : project.status
                            }
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No hay proyectos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
