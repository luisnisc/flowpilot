"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SideBar from "./SideBar";
import {
  FiSave,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

interface Project {
  _id: string;
  name: string;
  users: string[];
}

interface User {
  email: string;
  name?: string;
  role?: string;
}

export default function AddTaskForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams ? searchParams.get("projectId") : null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    project: projectId || "",
    assignedTo: session?.user?.email || "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.email) {
      setFormData((prev) => ({
        ...prev,
      }));
      fetchProjects();
      fetchUsers();
    }
  }, [status, router, session]);

  useEffect(() => {
    if (projectId) {
      setFormData((prev) => ({
        ...prev,
        project: projectId,
      }));
    }
  }, [projectId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Error al obtener usuarios");
      }

      const data = await res.json();
      console.log("Usuarios obtenidos:", data); 
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("No se pudieron cargar los usuarios");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Error al obtener proyectos");
      }

      const data = await res.json();
      setProjects(data);

      if (data.length > 0 && !projectId) {
        setFormData((prev) => ({
          ...prev,
          project: data[0]._id,
        }));
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("No se pudieron cargar los proyectos");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.project) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const dataToSubmit = {
        ...formData,
        assignedTo: formData.assignedTo || session?.user?.email || "",
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!res.ok) {
        throw new Error("Error al crear la tarea");
      }

      setSuccess("¡Tarea creada correctamente!");

      setTimeout(() => {
        {
          projectId
            ? router.push(`/projects/${projectId}`)
            : router.push("/tasks");
        }
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Error creating task:", err);
      setError("No se pudo crear la tarea. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
        <div className="w-16 h-16 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 font-medium">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-200">
      <SideBar />
      <main className="flex flex-col min-h-screen bg-gray-200 text-black pt-16 px-4 pb-6 md:p-6 lg:ml-[16.66667%]">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 mb-4 hover:text-blue-800 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Volver
        </button>

        <div className="max-w-2xl w-full mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white p-4 md:p-6">
              <h1 className="text-xl md:text-2xl font-bold">Nueva Tarea</h1>
              <p className="mt-1 text-blue-100 text-sm md:text-base">
                Completa el formulario para crear una nueva tarea
              </p>
            </div>
            {error && (
              <div className="mx-4 md:mx-6 mt-4 flex items-center bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                <FiAlertTriangle className="flex-shrink-0 mr-3" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mx-4 md:mx-6 mt-4 flex items-center bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
                <FiCheckCircle className="flex-shrink-0 mr-3" />
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 md:p-6">
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="title"
                  >
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Ej: Implementar diseño responsive"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="description"
                  >
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe detalladamente la tarea a realizar..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="project"
                    >
                      Proyecto <span className="text-red-500">*</span>
                    </label>

                    {projects.length > 0 ? (
                      <>
                        {projects.filter((proj) =>
                          proj.users.includes(
                            session?.user?.email || session?.user?.name || ""
                          )
                        ).length > 0 ? (
                          <select
                            id="project"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={formData.project}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                project: e.target.value,
                              }))
                            }
                            required
                          >
                            {projects
                              .filter((proj) =>
                                proj.users.includes(
                                  session?.user?.email ||
                                    session?.user?.name ||
                                    ""
                                )
                              )
                              .map((proj) => (
                                <option key={proj._id} value={proj._id}>
                                  {proj.name}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <div className="flex items-center p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium">
                                No estás asignado a ningún proyecto
                              </p>
                              <p className="text-sm mt-1">
                                Solo puedes crear tareas en proyectos donde
                                estés incluido como miembro. Contacta con un
                                administrador para ser añadido a proyectos
                                existentes o crea uno nuevo.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">
                            No hay proyectos disponibles
                          </p>
                          <p className="text-sm mt-1">
                            No se encontraron proyectos en el sistema. Es
                            necesario crear un proyecto antes de poder añadir
                            tareas.
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push("/projects/new")}
                            className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-900 transition-colors underline"
                          >
                            Crear nuevo proyecto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="priority"
                    >
                      Prioridad
                    </label>
                    <select
                      id="priority"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: e.target.value as "low" | "medium" | "high",
                        }))
                      }
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="assignedTo"
                  >
                    Asignado a
                  </label>
                  <select
                    id="assignedTo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.assignedTo}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: e.target.value,
                      }));
                    }}
                  >
                    <option value={session?.user?.email || ""}>
                      {session?.user?.name ||
                        session?.user?.email ||
                        "Usuario actual"}{" "}
                      (Tú)
                    </option>
                    {session?.user?.role === "admin" &&
                      users.map((user) => {
                        if (user.email !== session?.user?.email) {
                          return (
                            <option key={user.email} value={user.email}>
                              {user.name || user.email}
                            </option>
                          );
                        }
                        return null;
                      })}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || projects.length === 0}
                  className={`flex items-center px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                    submitting || projects.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" /> Guardar tarea
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
