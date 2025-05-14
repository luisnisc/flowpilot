"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEdit, FiX, FiLoader, FiSave, FiAlertCircle } from "react-icons/fi";
import { useSession } from "next-auth/react";

interface ProjectHeaderProps {
  id: string;
  name: string;
  description: string;
  isAdmin: boolean;
  category?: string;
  deadline?: string;
  status?: string;
}

export default function ProjectHeader({
  id,
  name,
  description,
  isAdmin,
  category: initialCategory = "general",
  deadline: initialDeadline = "",
  status: initialStatus = "active",
}: ProjectHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Estado para controlar la visibilidad del modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados para el formulario
  const [formName, setFormName] = useState(name);
  const [formDescription, setFormDescription] = useState(description);
  const [formCategory, setFormCategory] = useState(initialCategory);
  const [formDeadline, setFormDeadline] = useState(initialDeadline);
  const [formStatus, setFormStatus] = useState(initialStatus);

  // Estado para el proceso de guardado
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cuando cambian las props, actualizar los estados
  useEffect(() => {
    if (showEditModal) {
      setFormName(name);
      setFormDescription(description);
      setFormCategory(initialCategory);
      setFormStatus(initialStatus);

      // Formatear la fecha si existe
      if (initialDeadline) {
        try {
          const date = new Date(initialDeadline);
          setFormDeadline(date.toISOString().split("T")[0]);
        } catch (e) {
          console.error("Error formateando fecha:", e);
          setFormDeadline("");
        }
      } else {
        setFormDeadline("");
      }
    }
  }, [
    showEditModal,
    name,
    description,
    initialCategory,
    initialDeadline,
    initialStatus,
  ]);

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formName.trim() || !formDescription.trim()) {
      setFormError("El nombre y la descripción son obligatorios");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          category: formCategory,
          deadline: formDeadline || undefined,
          status: formStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Error ${res.status}: ${errorData}`);
      }

      // Éxito en la actualización
      setShowEditModal(false);

      // Recargar la página para ver los cambios
      router.refresh();
    } catch (error) {
      console.error("Error actualizando proyecto:", error);
      setFormError(
        error instanceof Error ? error.message : "Error desconocido"
      );
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{name || "Cargando..."}</h1>
          <p className="text-gray-600 mb-4 md:mb-0">{description || ""}</p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          {/* Botón para añadir tarea (todos los usuarios) */}
          <Link href={`/addTask?projectId=${id}`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Añadir tarea
            </button>
          </Link>

          {/* Botones solo para administradores */}
          {isAdmin && (
            <button
              onClick={handleEditClick}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <FiEdit className="mr-2" />
              Editar proyecto
            </button>
          )}
        </div>
      </div>

      {/* Modal para editar proyecto */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Cabecera del modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar proyecto</h2>
              <button
                title="Cerrar"
                onClick={handleCloseModal}
                className="text-white hover:bg-blue-800 rounded-full p-1"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Mostrar errores si hay */}
                {formError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{formError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos del formulario */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nombre del proyecto *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Categoría
                      </label>
                      <select
                        id="category"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
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
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Estado
                      </label>
                      <select
                        id="status"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Descripción *
                    </label>
                    <textarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formDescription.length}/500 caracteres
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
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
                        <FiLoader className="animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
