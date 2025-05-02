"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SideBar from "./SideBar";
import {
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaTimes,
  FaSave,
} from "react-icons/fa";

// Interfaces para tipado
interface Task {
  _id: string;
  title: string;
  description: string;
  project: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
}

export default function Tasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Estado para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.email) {
      fetchData();
    }
  }, [status, router, session]);

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch("/api/projects", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        fetch("/api/tasks", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      if (!projectsRes.ok) throw new Error("Failed to fetch projects");
      if (!tasksRes.ok) throw new Error("Failed to fetch tasks");

      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();

      const userTasks = tasksData.filter(
        (task: Task) => task.assignedTo === session?.user?.email
      );

      setProjects(projectsData);
      setTasks(userTasks);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos");
      setLoading(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p._id === projectId);
    return project ? project.name : "Proyecto desconocido";
  };

  const handleEdit = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task._id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setShowEditModal(true);
    }
  };

  const confirmDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch(`/api/tasks/${taskToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks(tasks.filter((task) => task._id !== taskToDelete));
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTask) return;

    setFormError(null);
    setUpdating(true);

    try {
      const res = await fetch(`/api/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingTask),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar la tarea");
      }

      // Actualizar el estado local con la tarea editada
      setTasks(
        tasks.map((task) => (task._id === editingTask._id ? editingTask : task))
      );

      setUpdateSuccess(true);

      // Cerrar el modal después de un breve momento
      setTimeout(() => {
        setShowEditModal(false);
        setEditingTask(null);
        setUpdateSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error updating task:", err);
      setFormError(err.message || "Error al actualizar la tarea");
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (editingTask) {
      setEditingTask({
        ...editingTask,
        [name]: value,
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <FaExclamationCircle className="text-red-500" title="Alta" />;
      case "medium":
        return <FaClock className="text-yellow-500" title="Media" />;
      case "low":
        return <FaCheckCircle className="text-green-500" title="Baja" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            Pendiente
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            En progreso
          </span>
        );
      case "review":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            En revisión
          </span>
        );
      case "done":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            Completada
          </span>
        );
      default:
        return null;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Cargando tus tareas...</p>
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
    <div className="relative min-h-screen bg-gray-200">
      <SideBar />
      <main className="flex flex-col min-h-screen bg-gray-200 text-black pt-16 px-4 pb-6 md:p-6 lg:ml-[16.66667%]">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">
            Mis Tareas
          </h1>

          <div className="flex space-x-3">
            <a href="/addTask">
              <button className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-md shadow">
                Agregar Tarea
              </button>
            </a>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-red-500 hover:bg-red-600 transition-colors text-white px-4 py-2 rounded-md shadow"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No tienes tareas asignadas</p>
            <a
              href="/addTask"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Crear mi primera tarea
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {task.title}
                          </span>
                          <span className="text-sm text-gray-500">
                            {task.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getProjectName(task.project)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1 text-sm text-gray-900 capitalize">
                            {task.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(task._id)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Editar tarea"
                          >
                            <FaEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => confirmDelete(task._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Eliminar tarea"
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal para editar tarea */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-gray-800/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md md:max-w-lg animate-fade-in">
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Editar Tarea</h3>
              <button
                title="Cerrar"
                onClick={() => setShowEditModal(false)}
                className="text-white hover:text-blue-200"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              {formError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                  <p>{formError}</p>
                </div>
              )}

              {updateSuccess && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
                  <p>¡Tarea actualizada correctamente!</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="title"
                  >
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTask.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="description"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTask.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="status"
                    >
                      Estado
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={editingTask.status}
                      onChange={handleInputChange}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En progreso</option>
                      <option value="review">En revisión</option>
                      <option value="done">Completada</option>
                    </select>
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
                      name="priority"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={editingTask.priority}
                      onChange={handleInputChange}
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
                    htmlFor="project"
                  >
                    Proyecto
                  </label>
                  <select
                    id="project"
                    name="project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={editingTask.project}
                    onChange={handleInputChange}
                  >
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                    updating ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full animate-fade-in">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
