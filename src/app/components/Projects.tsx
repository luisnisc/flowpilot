"use client";
import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import SideBar from "./SideBar";

// Define a type for your project data
interface Project {
  _id: string;
  name: string;
  description: string;
  tasks?: string;
  users?: string[];
  status?: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

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

      const data = await res.json();
      setProjects(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
      <div className="flex flex-col h-screen bg-gray-200 text-black p-6">
        <h1 className="text-3xl font-bold mb-6">Proyectos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              
              <a href={`/projects/${project._id}`} key={project._id}>
                <div
                  key={project._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  {project.status && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  )}
                </div>
              </a>
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
