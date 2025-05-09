"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import SideBar from "./SideBar";
import Chat from "./Chat";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import useProjectSync from "@/hooks/useProjectSync";
import dynamic from "next/dynamic";
import { FiPieChart } from "react-icons/fi"; // Añadir a tus importaciones de iconos
import Swal from "sweetalert2";
import usePresence from "@/hooks/usePresence";

// Importación dinámica para evitar problemas de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Task {
  _id: string;
  title: string;
  description: string;
  project: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
}

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  assignedToName?: string;
}

// Interfaces nuevas o actualizadas
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
  tasks: string[];
  users?: (string | User)[];
  status?: string;
}

interface ColumnData {
  backlog: KanbanTask[];
  in_progress: KanbanTask[];
  review: KanbanTask[];
  done: KanbanTask[];
  [key: string]: KanbanTask[];
}

const emptyColumns: ColumnData = {
  backlog: [],
  in_progress: [],
  review: [],
  done: [],
};

// Función auxiliar para evitar errores con split()
const getUserDisplayName = (user: string | User): string => {
  if (typeof user === "string") {
    // Si es un string (email), extraer la parte antes del @ como nombre de usuario
    return user.split("@")[0];
  } else if (user && typeof user === "object") {
    // Si es un objeto, usar primero name, o si no está disponible, extraer de email
    return user.name || (user.email ? user.email.split("@")[0] : "Usuario");
  }
  return "Usuario";
};

// Función auxiliar para obtener el email del usuario independientemente del formato
const getUserEmail = (user: string | User): string => {
  if (typeof user === "string") {
    return user;
  } else if (user && typeof user === "object") {
    return user.email || "";
  }
  return "";
};

// Función para mostrar notificaciones con SweetAlert2
const showNotification = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  message: string
) => {
  Swal.fire({
    icon: type,
    title: title,
    text: message,
    confirmButtonColor: "#3B82F6",
    timer: type === "success" ? 3000 : undefined,
    timerProgressBar: type === "success",
    toast: type === "success",
    position: type === "success" ? "top-end" : "center",
    showConfirmButton: type !== "success",
  });
};

interface ProjectDetailsProps {
  id: string;
}

export default function ProjectDetails({ id }: ProjectDetailsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [initialColumns, setInitialColumns] =
    useState<ColumnData>(emptyColumns);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const { columns, setColumns, connected, updateTask } = useProjectSync(
    id,
    emptyColumns
  );

  // Añade este hook para rastrear usuarios en línea
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const { onlineUsers, isConnected: presenceConnected } = usePresence(
    id,
    userEmail,
    userName
  );

  // Añade el estado para las pestañas si no lo tienes ya
  const [activeTab, setActiveTab] = useState<"kanban" | "chat" | "stats">(
    "kanban"
  );

  // Estados para los datos de los gráficos
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  });

  const [taskTimeline, setTaskTimeline] = useState<
    { date: string; completed: number; created: number }[]
  >([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ email: string; name: string }>
  >([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadStatsData = async () => {
    if (activeTab !== "stats" || !id) return;

    setIsLoadingStats(true);
    try {
      // Obtener estadísticas de tareas
      const tasksResponse = await fetch(`/api/stats/tasks?projectId=${id}`);
      if (tasksResponse.ok) {
        const data = await tasksResponse.json();
        setTaskStats(data.taskStats);
      } else {
        console.error(
          "Error cargando estadísticas de tareas:",
          await tasksResponse.text()
        );
        // Establecer datos predeterminados en caso de error
        setTaskStats({
          pending: 1,
          in_progress: 1,
          review: 1,
          done: 1,
        });
      }

      // Obtener datos de timeline
      const timelineResponse = await fetch(
        `/api/stats/timeline?projectId=${id}`
      );
      if (timelineResponse.ok) {
        const data = await timelineResponse.json();
        setTaskTimeline(data.timeline);
      } else {
        console.error(
          "Error cargando timeline:",
          await timelineResponse.text()
        );
        // Establecer datos predeterminados en caso de error
        setTaskTimeline(
          Array.from({ length: 14 }).map((_, i) => ({
            date: `05-${i + 1}`,
            created: Math.floor(Math.random() * 3),
            completed: Math.floor(Math.random() * 2),
          }))
        );
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      // Establecer datos predeterminados
      setTaskStats({
        pending: 1,
        in_progress: 1,
        review: 1,
        done: 1,
      });
      setTaskTimeline(
        Array.from({ length: 14 }).map((_, i) => ({
          date: `05-${i + 1}`,
          created: Math.floor(Math.random() * 3),
          completed: Math.floor(Math.random() * 2),
        }))
      );
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Efecto para cargar estadísticas cuando se cambia a esa pestaña
  useEffect(() => {
    loadStatsData();
  }, [activeTab, id]);

  // Opciones para el gráfico circular de estado de tareas
  const taskStatusOptions = {
    chart: {
      type: "donut" as const,
      fontFamily: "Inter, sans-serif",
    },
    labels: ["Pendientes", "En Progreso", "En Revisión", "Completadas"],
    colors: ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"],
    legend: {
      position: "bottom" as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
              },
            },
          },
        },
      },
    },
  };

  const taskStatusSeries = [
    taskStats.pending,
    taskStats.in_progress,
    taskStats.review,
    taskStats.done,
  ];

  // Opciones para el gráfico de línea de tareas a lo largo del tiempo
  const timelineOptions = {
    chart: {
      height: 350,
      type: "line" as const,
      zoom: {
        enabled: true,
      },
      fontFamily: "Inter, sans-serif",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: [3, 3],
    },
    title: {
      text: "Evolución de Tareas",
      align: "center" as const,
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: taskTimeline.map((item) => item.date),
      labels: {
        rotate: -45,
        rotateAlways: false,
      },
    },
    yaxis: {
      title: {
        text: "Número de Tareas",
      },
    },
    legend: {
      position: "top" as const,
    },
    colors: ["#3B82F6", "#F59E0B"],
  };

  const timelineSeries = [
    {
      name: "Tareas Completadas",
      data: taskTimeline.map((item) => item.completed),
    },
    {
      name: "Tareas Creadas",
      data: taskTimeline.map((item) => item.created),
    },
  ];

  // Gráfico de progreso del proyecto (medidor)
  const totalTasks =
    taskStats.pending +
    taskStats.in_progress +
    taskStats.review +
    taskStats.done;
  const progressPercentage =
    totalTasks > 0 ? Math.round((taskStats.done / totalTasks) * 100) : 0;

  const projectProgressOptions = {
    chart: {
      height: 280,
      type: "radialBar" as const,
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: "70%",
        },
        track: {
          background: "#e7e7e7",
          strokeWidth: "97%",
          margin: 5,
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            color: "#999",
            opacity: 1,
            blur: 2,
          },
        },
        dataLabels: {
          name: {
            fontSize: "16px",
            color: "#333",
            offsetY: 120,
          },
          value: {
            offsetY: 76,
            fontSize: "22px",
            color: undefined,
            formatter: function (val: number) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        shadeIntensity: 0.15,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 65, 91],
      },
    },
    stroke: {
      dashArray: 4,
    },
    series: [progressPercentage],
    labels: ["Progreso del Proyecto"],
    colors: ["#10B981"],
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Verificar si el usuario es administrador
      setIsAdmin(session?.user?.role === "admin");
      fetchProjects();
    }
  }, [status, router, id]);

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
      const selectedProject = data.find((p: Project) => p._id === id);

      if (!selectedProject) {
        setError("Proyecto no encontrado");
        setLoading(false);
        return;
      }

      setProject(selectedProject);

      const tasksRes = await fetch("/api/tasks", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!tasksRes.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const tasksData = await tasksRes.json();

      const projectTasks = tasksData.filter(
        (task: Task) => task.project === selectedProject._id
      );

      const newColumns: ColumnData = {
        backlog: [],
        in_progress: [],
        review: [],
        done: [],
      };

      projectTasks.forEach((task: Task) => {
        const kanbanTask: KanbanTask = {
          id: task._id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo,
        };
        if (task.status === "pending") {
          newColumns.backlog.push(kanbanTask);
        } else if (task.status === "in_progress") {
          newColumns.in_progress.push(kanbanTask);
        } else if (task.status === "review") {
          newColumns.review.push(kanbanTask);
        } else if (task.status === "done") {
          newColumns.done.push(kanbanTask);
        }
      });

      setInitialColumns(newColumns);
      setColumns(newColumns);
      setInitialDataLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching project data:", err);
      setError("Failed to load project details");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      initialDataLoaded &&
      Object.values(initialColumns).some((col) => col.length > 0)
    ) {
      console.log("Actualizando columnas con datos iniciales");
      setColumns(initialColumns);
    }
  }, [initialColumns, initialDataLoaded, setColumns]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const allUsers = await response.json();

      // Filtrar usuarios que ya están en el proyecto
      const projectUsers = project?.users || [];
      const filteredUsers = allUsers.filter(
        (user: any) => !projectUsers.includes(user.email)
      );

      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const handleAddUsers = async () => {
    try {
      if (!selectedUsers.length) return;

      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error("Failed to add users to project");
      }

      setProject((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          users: [...(prev.users || []), ...selectedUsers],
        };
      });

      // Cerrar modal y limpiar selección
      setShowAddUserModal(false);
      setSelectedUsers([]);

      // Reemplazar alert por SweetAlert2
      Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "Usuarios añadidos correctamente",
        confirmButtonColor: "#3B82F6",
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error adding users to project:", error);
      // Reemplazar alert de error por SweetAlert2
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron añadir los usuarios al proyecto",
        confirmButtonColor: "#3B82F6",
      });
    }
  };

  if (loading) {
    return (
      <>
        <SideBar />
        <div className="flex items-center justify-center min-h-screen w-full bg-gray-200 md:ml-[16.66667%]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
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

  if (!project) {
    return <div>No se encontró el proyecto</div>;
  }

  const handleRemoveUser = async (email: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ removeUser: email }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove user from project");
      }

      // El resto del código puede permanecer igual
      setProject((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          users: prev.users?.filter((user) => getUserEmail(user) !== email),
        };
      });

      // Reemplazar alert por SweetAlert2
      Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "Usuario eliminado correctamente",
        confirmButtonColor: "#3B82F6",
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error removing user from project:", error);
      // Reemplazar alert de error por SweetAlert2
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el usuario del proyecto",
        confirmButtonColor: "#3B82F6",
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Si no hay destino, no hacemos nada
    if (!destination) return;

    // Si la tarea no cambió de columna, no hacemos nada
    if (source.droppableId === destination.droppableId) return;

    try {
      // Llamar a la API para actualizar el estado de la tarea
      const response = await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: draggableId,
          newStatus: destination.droppableId, // El nuevo estado de la tarea
        }),
      });

      if (!response.ok) {
        console.error("Error al actualizar la tarea:", await response.text());
        return;
      }

      // Actualizar el estado local (opcional, dependiendo de cómo manejes el estado)
      const updatedColumns = { ...columns };
      const [movedTask] = updatedColumns[source.droppableId].splice(
        source.index,
        1
      );
      updatedColumns[destination.droppableId].splice(
        destination.index,
        0,
        movedTask
      );

      setColumns(updatedColumns);
    } catch (error) {
      console.error("Error al manejar el evento onDragEnd:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        console.error("Error al actualizar el estado de la tarea");
        showNotification(
          "error",
          "Error",
          "No se pudo actualizar el estado de la tarea"
        );
      } else {
        showNotification(
          "success",
          "¡Estado actualizado!",
          "El estado de la tarea se actualizó correctamente"
        );
      }
    } catch (error) {
      console.error("Error al actualizar el estado de la tarea:", error);
      showNotification(
        "error",
        "Error",
        "Hubo un problema al conectar con el servidor"
      );
    }
  };

  // Función helper para renderizar la tarjeta de tarea (evitar duplicación de código)
  const renderTaskCard = (task: KanbanTask, provided: any, snapshot: any) => {
    const isAdmin = session?.user?.role === "admin";
    const isAssignedToUser = task.assignedTo === session?.user?.email;
    const canDrag = isAdmin || isAssignedToUser;

    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
          snapshot.isDragging ? "shadow-lg" : ""
        } ${!canDrag ? "opacity-80 cursor-not-allowed" : ""}`}
      >
        <div className="flex justify-between items-center mb-1 md:mb-2">
          <div className="flex items-center">
            {/* Avatar del usuario asignado */}
            {task.assignedTo && (
              <div className="flex-shrink-0 mr-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    task.assignedToName || task.assignedTo
                  )}&background=random&color=fff&size=32`}
                  alt={`${task.assignedToName || task.assignedTo}`}
                  title={`Asignado a: ${
                    task.assignedToName || task.assignedTo
                  }`}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                />
              </div>
            )}
            <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px] ">
              {task.title}
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              task.priority === "high"
                ? "bg-red-100 text-red-800"
                : task.priority === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {task.priority}
          </span>
        </div>
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
          {task.description}
        </p>

        {/* Indicador visual cuando no se puede arrastrar */}
        {!canDrag && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Solo el propietario puede mover esta tarea
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <SideBar />
      <main className="min-h-screen bg-gray-200 pt-16 md:pt-6 px-4 py-6 md:p-6 md:ml-[16.66667%] text-black">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {project?.name || "Cargando..."}
            </h1>
            <p className="text-gray-600 mb-4 md:mb-0">
              {project?.description || ""}
            </p>
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
              <>
                {/* Botón para editar proyecto */}
                <Link href={`/projects/edit/${id}`}>
                  <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center text-sm">
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                    Editar proyecto
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Modal para añadir usuarios */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Añadir usuarios al proyecto
                </h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selecciona los usuarios que quieres añadir a este proyecto
                </p>

                {availableUsers.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded">
                    {availableUsers.map((user) => (
                      <div
                        key={user.email}
                        className="flex items-center p-2 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`user-${user.email}`}
                          checked={selectedUsers.includes(user.email)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers((prev) => [...prev, user.email]);
                            } else {
                              setSelectedUsers((prev) =>
                                prev.filter((email) => email !== user.email)
                              );
                            }
                          }}
                          className="mr-2"
                        />
                        <label
                          htmlFor={`user-${user.email}`}
                          className="flex items-center cursor-pointer flex-1"
                        >
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name || user.email
                            )}&size=32&background=random`}
                            alt={user.name || user.email}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                          <div>
                            <div>{user.name || "Usuario"}</div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay usuarios disponibles para añadir
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddUsers}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={selectedUsers.length === 0}
                >
                  Añadir seleccionados
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pestañas de navegación */}
        <div className="border-b border-gray-300 mb-6">
          <nav className="flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center 
                ${
                  activeTab === "kanban"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Kanban
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${
                  activeTab === "chat"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
              Chat
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${
                  activeTab === "stats"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FiPieChart className="mr-2 h-5 w-5" />
              Estadísticas
            </button>
          </nav>
        </div>

        {/* Contenido de la pestaña seleccionada */}
        {activeTab === "kanban" && (
          <div>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-100 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-gray-700">
                    Por hacer
                  </h2>
                  <Droppable droppableId="backlog">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.backlog.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="bg-blue-50 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-blue-700">
                    En progreso
                  </h2>
                  <Droppable droppableId="in_progress">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.in_progress.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="bg-yellow-50 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-yellow-700">
                    En revisión
                  </h2>
                  <Droppable droppableId="review">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.review.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="bg-green-50 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-green-700">
                    Completado
                  </h2>
                  <Droppable droppableId="done">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.done.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>

            <div id="usersList" className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Usuarios del Proyecto
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      fetchAvailableUsers();
                      setShowAddUserModal(true);
                    }}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Añadir usuarios
                  </button>
                )}
              </div>

              {project.users && project.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {project.users.map((user, index) => {
                    // Verificar el tipo de usuario y extraer los datos necesarios
                    const username = getUserDisplayName(user);
                    const userEmail = getUserEmail(user).toLowerCase().trim(); // Normalizar aquí también
                    const isCurrentUser =
                      userEmail === session?.user?.email?.toLowerCase().trim();

                    // Verificar si el usuario está en línea
                    const isOnline = onlineUsers.includes(userEmail);

                    // Log para depuración
                    console.log(
                      `Usuario ${userEmail}: ${isOnline ? "online" : "offline"}`
                    );

                    return (
                      <div
                        key={userEmail}
                        className={`flex items-center p-3 rounded-lg border ${
                          isCurrentUser
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        } hover:shadow-md transition-all`}
                      >
                        <div className="relative">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              username
                            )}&background=random&color=fff&size=48`}
                            alt={username}
                            className={`w-12 h-12 rounded-full ${
                              isCurrentUser ? "ring-2 ring-blue-500" : ""
                            }`}
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
                              isOnline ? "bg-green-500" : "bg-gray-300"
                            }`}
                            title={isOnline ? "En línea" : "Desconectado"}
                          ></span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {username}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                Tú
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {userEmail}
                            {isOnline && (
                              <span className="ml-1.5 text-xs font-normal text-green-600">
                                • en línea
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    No hay usuarios asignados a este proyecto.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        fetchAvailableUsers();
                        setShowAddUserModal(true);
                      }}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Añadir el primer usuario
                    </button>
                  )}
                </div>
              )}

              {/* Estadísticas de colaboración - solo visible si hay al menos 3 usuarios */}
              {project.users && project.users.length >= 3 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex flex-wrap justify-between text-sm text-gray-600">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-4 h-4 mr-1 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Total: {project.users.length} usuarios
                    </div>
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-4 h-4 mr-1 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Actualizado: {new Date().toLocaleDateString()}
                    </div>
                  </div>

                  {/* Avatares apilados para efecto visual */}
                  <div className="flex -space-x-2 overflow-hidden mt-3">
                    {project.users.slice(0, 5).map((user, index) => (
                      <img
                        key={getUserEmail(user)}
                        className={`inline-block h-8 w-8 rounded-full ring-2 ring-white`}
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          getUserDisplayName(user)
                        )}&background=random&color=fff&size=32`}
                        alt={getUserDisplayName(user)}
                      />
                    ))}
                    {project.users.length > 5 && (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 ring-2 ring-white text-xs font-medium text-gray-800">
                        +{project.users.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-[calc(100vh-200px)]">
            <Chat projectId={id} />
          </div>
        )}

        {activeTab === "stats" && (
          <div className="mt-4">
            {isLoadingStats ? (
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded md:col-span-2"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-6">
                  Estadísticas del Proyecto
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gráfico circular de estado de tareas */}
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                      Estado de Tareas
                    </h3>
                    <Chart
                      options={taskStatusOptions}
                      series={taskStatusSeries}
                      type="donut"
                      height={320}
                    />
                  </div>

                  {/* Gráfico de progreso del proyecto */}
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                      Progreso General
                    </h3>
                    <Chart
                      options={projectProgressOptions}
                      series={projectProgressOptions.series}
                      type="radialBar"
                      height={320}
                    />
                  </div>

                  {/* Gráfico de línea de tareas a lo largo del tiempo */}
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">
                      Evolución Temporal
                    </h3>
                    <Chart
                      options={timelineOptions}
                      series={timelineSeries}
                      type="line"
                      height={350}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {presenceConnected && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            Sistema de presencia activo
          </div>
        )}
      </main>
    </>
  );
}
