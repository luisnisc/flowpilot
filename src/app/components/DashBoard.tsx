"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import SideBar from "./SideBar";
import { FiFolder, FiList, FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight } from "react-icons/fi";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  project?: {
    _id: string;
    name: string;
  };
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  users: string[];
  tasks?: number;
}

export default function DashBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      setIsAdmin(true);
    }
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      Promise.all([
        fetch("/api/tasks", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        fetch("/api/projects", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
      ])
        .then(async ([tasksRes, projectsRes]) => {
          if (!tasksRes.ok) throw new Error("Error al obtener tareas");
          if (!projectsRes.ok) throw new Error("Error al obtener proyectos");
          
          const tasksData = await tasksRes.json();
          const projectsData = await projectsRes.json();
          
          return [tasksData, projectsData];
        })
        .then(([tasksData, projectsData]) => {
          setTasks(tasksData);
          setProjects(projectsData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching data:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [status, router, session]);

  const userTasks = isAdmin ? tasks : tasks.filter(
    (task) => 
      task.assignedTo === session?.user?.email && 
      task.status !== "done"
  );

  const activeProjects = isAdmin ? projects.filter(
    (project) => project.status !== "completed"
  ) : projects.filter(
    (project) =>
      project.status !== "completed" &&
      (project.users?.includes(session?.user?.email || "") || 
       project.users?.includes(session?.user?.name || ""))
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FiClock className="w-4 h-4 text-gray-500" />;
      case "in_progress":
        return <FiAlertCircle className="w-4 h-4 text-blue-500" />;
      case "review":
        return <FiCheckCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

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
    <div className="relative min-h-screen bg-gray-200">
      <SideBar />
      <main className="flex flex-col min-h-screen bg-gray-200 text-black px-4 pt-16 pb-6 md:p-6 lg:ml-[16.66667%]">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            Bienvenido, {session?.user?.name || session?.user?.email}
          </h1>
        </div>
        <div className="flex items-center justify-center h-[85vh] mt-15 md:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center">
                <FiList className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Tus tareas pendientes</h2>
              </div>
              <Link
                href="/tasks"
                className="flex items-center text-sm bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50"
              >
                Ver todas <FiArrowRight className="ml-1" />
              </Link>
            </div>
            
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {userTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tienes tareas pendientes.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userTasks.map((task) => (
                    <li key={task._id} className="py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          {getStatusIcon(task.status)}
                          <div className="ml-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {task.description}
                            </p>
                            {task.project && (
                              <span className="text-xs text-blue-600">
                                {task.project.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <Link 
                href="/addTask"
                className="block w-full py-2 bg-blue-100 text-blue-700 text-center rounded hover:bg-blue-200 transition-colors"
              >
                Crear nueva tarea
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden h-max">
            <div className="p-4 bg-green-600 text-white flex justify-between items-center">
              <div className="flex items-center">
                <FiFolder className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Proyectos activos</h2>
              </div>
              <Link
                href="/projects"
                className="flex items-center text-sm bg-white text-green-600 px-3 py-1 rounded hover:bg-green-50"
              >
                Ver todos <FiArrowRight className="ml-1" />
              </Link>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay proyectos activos actualmente.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {activeProjects.map((project) => (
                    <li 
                      key={project._id} 
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <Link href={`/projects/${project._id}`}>
                        <h3 className="font-semibold text-lg text-green-700">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {project.description}
                        </p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{project.users?.length || 0} miembros</span>
                        </div>
                      </Link>
                    </li>
                    
                  ))}
                </ul>
              )}
            </div>
            
            </div>
          </div>
        </div>

        <div className="mt-6 lg:hidden">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/tasks"
                className="flex items-center justify-center bg-blue-100 text-blue-700 p-3 rounded hover:bg-blue-200 transition-colors"
              >
                <FiList className="w-5 h-5 mr-2" /> Ir a tareas
              </Link>
              <Link
                href="/projects"
                className="flex items-center justify-center bg-green-100 text-green-700 p-3 rounded hover:bg-green-200 transition-colors"
              >
                <FiFolder className="w-5 h-5 mr-2" /> Ir a proyectos
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}