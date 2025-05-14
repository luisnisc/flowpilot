"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiLoader,
  FiCheck,
  FiAlertCircle,
  FiSave,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

interface User {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  role?: string;
  image?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  users?: (string | User)[];
  status?: string;
  category?: string;
  deadline?: string;
}

interface EditProjectFormProps {
  projectId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function EditProjectForm({ 
  projectId, 
  onCancel, 
  onSuccess 
}: EditProjectFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Estados para el formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState("active");
  const [projectUsers, setProjectUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: false,
    description: false,
  });

  // Categorías predefinidas para proyectos
  const categories = [
    { id: "general", name: "General" },
    { id: "development", name: "Desarrollo" },
    { id: "design", name: "Diseño" },
    { id: "marketing", name: "Marketing" },
    { id: "research", name: "Investigación" },
  ];

  const statusOptions = [
    { id: "active", name: "Activo" },
    { id: "on_hold", name: "En espera" },
    { id: "completed", name: "Completado" },
    { id: "canceled", name: "Cancelado" },
  ];

  // Cargar datos del proyecto
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        console.log("Obteniendo datos para el proyecto ID:", projectId);

        const projectRes = await fetch(`/api/projects/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!projectRes.ok) {
          let errorMessage = "Error al cargar el proyecto";
          try {
            const errorData = await projectRes.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error("No se pudo parsear la respuesta de error", e);
          }

          throw new Error(`Error ${projectRes.status}: ${errorMessage}`);
        }

        // Extraer datos como texto primero para depuración
        const responseText = await projectRes.text();
        console.log("Respuesta de la API (texto):", responseText);

        // Intentar parsear como JSON
        let projectData: Project;
        try {
          projectData = JSON.parse(responseText);
          console.log("Datos del proyecto obtenidos:", projectData);
        } catch (e) {
          console.error("Error al parsear la respuesta como JSON:", e);
          throw new Error("La respuesta del servidor no es un JSON válido");
        }

        if (!projectData || typeof projectData !== "object") {
          throw new Error("Formato de respuesta inválido");
        }

        // Configurar estados con datos del proyecto
        setName(projectData.name || "");
        setDescription(projectData.description || "");
        setCategory(projectData.category || "general");
        setStatus(projectData.status || "active");

        if (projectData.deadline) {
          try {
            // Formatear la fecha a YYYY-MM-DD para el input date
            const date = new Date(projectData.deadline);
            const formattedDate = date.toISOString().split("T")[0];
            setDeadline(formattedDate);
          } catch (e) {
            console.error("Error al formatear la fecha:", e);
            setDeadline("");
          }
        }

        // Extraer emails de usuarios con manejo más robusto
        let userEmails: string[] = [];
        if (Array.isArray(projectData.users)) {
          userEmails = projectData.users
            .map((user) => {
              if (typeof user === "string") return user;
              if (user && typeof user === "object" && "email" in user)
                return user.email;
              return "";
            })
            .filter((email) => email); // Filtrar valores vacíos
        }

        setProjectUsers(userEmails);

        await fetchAvailableUsers();

        setLoading(false);
      } catch (error) {
        console.error("Error cargando datos del proyecto:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error instanceof Error
              ? `Error: ${error.message}`
              : "No se pudo cargar la información del proyecto",
          confirmButtonColor: "#3B82F6",
        });
        
        if (onCancel) {
          onCancel();
        } else {
          router.push(`/projects/${projectId}`);
        }
      }
    };

    if (projectId) {
      fetchProjectData();
    } else {
      console.error("ID de proyecto no proporcionado");
      
      if (onCancel) {
        onCancel();
      } else {
        router.push("/projects");
      }
    }
  }, [projectId, router, onCancel]);

  // Cargar usuarios disponibles
  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Error obteniendo usuarios");
      }

      const data = await res.json();
      setAvailableUsers(data);

      return data;
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los usuarios",
        confirmButtonColor: "#3B82F6",
      });
      return [];
    }
  };

  // Validar el formulario
  const validateForm = () => {
    const errors = {
      name: !name.trim(),
      description: !description.trim(),
    };

    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  // Manejar selección de usuario
  const handleUserToggle = (email: string) => {
    setProjectUsers((prevUsers) => {
      if (prevUsers.includes(email)) {
        return prevUsers.filter((e) => e !== email);
      } else {
        return [...prevUsers, email];
      }
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa todos los campos obligatorios",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    setSaving(true);

    try {
      // Asegurar que el usuario actual esté incluido
      const currentUserEmail = session?.user?.email;
      let allUsers = [...projectUsers];

      if (currentUserEmail && !allUsers.includes(currentUserEmail)) {
        allUsers.push(currentUserEmail);
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          users: allUsers,
          deadline: deadline || undefined,
          category,
          status,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar el proyecto");
      }

      Swal.fire({
        icon: "success",
        title: "¡Proyecto actualizado!",
        text: "El proyecto se ha actualizado correctamente",
        confirmButtonColor: "#3B82F6",
      }).then(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/projects/${projectId}`);
          router.refresh();
        }
      });
    } catch (error) {
      console.error("Error actualizando proyecto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el proyecto. Inténtalo de nuevo.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 font-medium">
          Cargando datos del proyecto...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Información básica */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">Información básica</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre del proyecto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Nombre del proyecto"
                  maxLength={100}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" />
                    Este campo es obligatorio
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Categoría
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="deadline"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha límite
                </label>
                <input
                  type="date"
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Estado
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border ${
                    formErrors.description
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Describe el propósito y objetivos del proyecto"
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" />
                    Este campo es obligatorio
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {description.length}/500 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Selección de usuarios */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">
              Miembros del proyecto
            </h2>

            {availableUsers.length === 0 ? (
              <div className="text-gray-500 italic">
                No hay usuarios disponibles para añadir
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Gestiona los usuarios de este proyecto. Siempre deberás
                  estar incluido como miembro del proyecto.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableUsers.map((user) => (
                    <div
                      key={user.email}
                      className={`
                        flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${
                          projectUsers.includes(user.email)
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }
                        ${
                          user.email === session?.user?.email
                            ? "opacity-70 cursor-not-allowed"
                            : ""
                        }
                      `}
                      onClick={() => {
                        // No permitir deseleccionar al usuario actual
                        if (user.email !== session?.user?.email) {
                          handleUserToggle(user.email);
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <img
                          src={
                            user.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name || user.email
                            )}&background=random&color=fff&size=32`
                          }
                          alt={user.name || user.email}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || user.email.split("@")[0]}
                          {user.email === session?.user?.email && " (Tú)"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="ml-2">
                        <div
                          className={`
                          w-5 h-5 rounded-full flex items-center justify-center
                          ${
                            projectUsers.includes(user.email)
                              ? "bg-blue-500"
                              : "border border-gray-300"
                          }
                        `}
                        >
                          {projectUsers.includes(user.email) && (
                            <FiCheck className="text-white text-sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  {projectUsers.length} usuario
                  {projectUsers.length !== 1 ? "s" : ""} seleccionado
                  {projectUsers.length !== 1 ? "s" : ""}
                </div>
              </>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel || (() => router.back())}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? (
                <>
                  <FiLoader className="inline-block mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="inline-block mr-2" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}