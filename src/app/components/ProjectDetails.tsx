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
}

interface Project {
  _id: string;
  name: string;
  description: string;
  tasks: string[];
  users?: string[];
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
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
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];

      const draggedTask = sourceColumn.find((task) => task.id === draggableId);
      if (!draggedTask) {
        console.error("No se encontró la tarea arrastrada");
        return;
      }

      const columnToStatus: Record<
        string,
        "pending" | "in_progress" | "review" | "done"
      > = {
        backlog: "pending",
        in_progress: "in_progress",
        review: "review",
        done: "done",
      };

      const updatedTask: KanbanTask = {
        ...draggedTask,
        status: columnToStatus[destination.droppableId],
      };

      const newSourceColumn = [...sourceColumn];
      newSourceColumn.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        newSourceColumn.splice(destination.index, 0, updatedTask);
        setColumns({
          ...columns,
          [source.droppableId]: newSourceColumn,
        });
      } else {
        const newDestColumn = [...destColumn];
        newDestColumn.splice(destination.index, 0, updatedTask);
        setColumns({
          ...columns,
          [source.droppableId]: newSourceColumn,
          [destination.droppableId]: newDestColumn,
        });

        updateTaskStatus(
          draggedTask.id,
          columnToStatus[destination.droppableId]
        );
      }

      updateTask(
        draggedTask.id,
        columnToStatus[destination.droppableId],
        updatedTask
      );
    } catch (error) {
      console.error("Error en onDragEnd:", error);
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
      }
    } catch (error) {
      console.error("Error al actualizar el estado de la tarea:", error);
    }
  };

  return (
    <>
      <SideBar />

      <main className="min-h-screen bg-gray-200 pt-16 md:pt-6 px-4 py-6 md:p-6 md:ml-[16.66667%] text-black relative">
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
        >
          ← Volver
        </button>

        <h1 className="text-2xl md:text-3xl font-bold mt-2">{project?.name}</h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          {project?.description}
        </p>
        <div className="flex flex-row gap-4">
          {project?.status && (
            <span
              className={`px-3 py-1 rounded-full text-xs md:text-sm mt-2 inline-block ${
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

          <Link
            href={`/addTask?projectId=${id}`}
            className="m-4 px-3 py-1 md:px-4 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center w-max md:mt-7 md:mr-7 md:absolute md:right-0 md:top-0 text-sm md:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva tarea
          </Link>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    {columns.backlog.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 md:mb-2">
                              <h3 className="font-semibold text-sm md:text-base">
                                {task.title}
                              </h3>
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
                          </div>
                        )}
                      </Draggable>
                    ))}
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
                    {columns.in_progress.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 md:mb-2">
                              <h3 className="font-semibold text-sm md:text-base">
                                {task.title}
                              </h3>
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
                          </div>
                        )}
                      </Draggable>
                    ))}
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
                    {columns.review.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 md:mb-2">
                              <h3 className="font-semibold text-sm md:text-base">
                                {task.title}
                              </h3>
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
                          </div>
                        )}
                      </Draggable>
                    ))}
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
                    {columns.done.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 md:mb-2">
                              <h3 className="font-semibold text-sm md:text-base">
                                {task.title}
                              </h3>
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
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>

        <div className="mt-4 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 h-max">
            <h2 className="font-bold text-lg md:text-xl mb-3 md:mb-4 text-gray-800">
              Usuarios asignados
            </h2>

            {project?.users && project.users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {project.users.map((user) => (
                  <div
                    key={user}
                    className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user
                        )}&background=random&color=fff&size=48`}
                        alt={`Avatar de ${user}`}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow"
                      />
                    </div>
                    <div className="ml-2 md:ml-3">
                      <div className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-full">
                        {user}
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500">
                        {user.includes("@") ? "Miembro" : "Usuario"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm md:text-base">
                No hay usuarios asignados a este proyecto
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden h-[400px] md:h-[500px]">
            <Chat projectId={id} />
          </div>
        </div>

        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
              connected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span>{connected ? "Conectado" : "Desconectado"}</span>
          </div>
        </div>
      </main>
    </>
  );
}
