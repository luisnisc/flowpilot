"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DropResult } from "@hello-pangea/dnd";
import SideBar from "./SideBar";
import Chat from "./Chat";
import useProjectSync from "@/hooks/useProjectSync";
import usePresence from "@/hooks/usePresence";

// Importamos los nuevos componentes modulares
import KanbanBoard from "./project/kanban/KanbanBoard";
import ProjectStats from "./project/stats/ProjectStats";
import ProjectUsers from "./project/ProjectUsers";
import ProjectHeader from "./project/ProjectHeader";
import ProjectTabs from "./project/ProjectTabs";

interface Task {
  _id: string;
  title: string;
  description: string;
  project: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  assignedToName?: string;
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

  // Hook para rastrear usuarios en línea
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const { onlineUsers, isConnected: presenceConnected } = usePresence(
    id,
    userEmail,
    userName
  );

  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState<"kanban" | "chat" | "stats">(
    "kanban"
  );

  const [isAdmin, setIsAdmin] = useState(false);

  // Cargar datos del proyecto y tareas
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      fetchProjectData();

      // Verificar si el usuario es administrador
      if (session?.user?.role === "admin") {
        setIsAdmin(true);
      }
    }
  }, [status, id, session]);

  // Función para obtener datos del proyecto
  const fetchProjectData = async () => {
    try {
      const projectsRes = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!projectsRes.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projectsData = await projectsRes.json();
      const selectedProject = projectsData.find((p: Project) => p._id === id);

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

  // Manejar el arrastre y soltar de tareas
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    try {
      // Mapeo explícito de columnas a estados
      const columnToStatus: Record<
        string,
        "pending" | "in_progress" | "review" | "done"
      > = {
        backlog: "pending",
        in_progress: "in_progress",
        review: "review", 
        done: "done",
      };

      // Obtener la tarea que se está moviendo
      const sourceColumn = columns[source.droppableId as keyof typeof columns];
      const taskToMove = sourceColumn.find((task) => task.id === draggableId);

      if (!taskToMove) {
        console.error("Tarea no encontrada:", draggableId);
        return;
      }

      // Obtener el nuevo estado basado en la columna de destino
      const newStatus = columnToStatus[destination.droppableId];

      // Llamar a updateTask que manejará la actualización del estado
      updateTask(taskToMove.id, newStatus, taskToMove);
    } catch (error) {
      console.error("Error en onDragEnd:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideBar />
      <main className="min-h-screen bg-gray-200 pt-16 md:pt-6 px-4 py-6 md:p-6 md:ml-[16.66667%] text-black">
        {project && (
          <ProjectHeader
            id={id}
            name={project.name}
            description={project.description}
            isAdmin={isAdmin}
          />
        )}

        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenido de la pestaña seleccionada */}
        {activeTab === "kanban" && (
          <div>
          <KanbanBoard columns={columns} onDragEnd={onDragEnd} />
          <ProjectUsers
            projectId={id}
            users={project.users || []}
            isAdmin={isAdmin}
            onlineUsers={onlineUsers}
            userEmail={userEmail}
          />
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-[calc(100vh-200px)]">
            <Chat projectId={id} />
          </div>
        )}

        {activeTab === "stats" && <ProjectStats projectId={id} />}

        

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
