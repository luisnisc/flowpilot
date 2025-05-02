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
  status: string;
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
  [key: string]: KanbanTask[]; // Índice dinámico para acceso por strings
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
  const [columns, setColumns] = useState<ColumnData>(emptyColumns);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      setColumns(newColumns);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching project data:", err);
      setError("Failed to load project details");
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Cargando proyecto...</p>
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

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];

    const draggedTask = sourceColumn.find((task) => task.id === draggableId);
    if (!draggedTask) return;

    const columnToStatus: Record<string, string> = {
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

      updateTaskStatus(draggedTask.id, columnToStatus[destination.droppableId]);
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
      <main className="flex flex-col h-full bg-gray-200 text-black ml-[19.66667%] p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600 mt-2">{project.description}</p>
          {project.status && (
            <span
              className={`px-3 py-1 rounded-full text-sm mt-2 inline-block ${
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

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-100 rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4 text-gray-700">
                Por hacer
              </h2>
              <Droppable droppableId="backlog">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[35vh]"
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
                            className={`bg-white p-4 rounded shadow mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
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
                            <p className="text-sm text-gray-600">
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
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4 text-blue-700">
                En progreso
              </h2>
              <Droppable droppableId="in_progress">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[35vh]"
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
                            className={`bg-white p-4 rounded shadow mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
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
                            <p className="text-sm text-gray-600">
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

            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4 text-yellow-700">
                En revisión
              </h2>
              <Droppable droppableId="review">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[35vh]"
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
                            className={`bg-white p-4 rounded shadow mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
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
                            <p className="text-sm text-gray-600">
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

            <div className="bg-green-50 rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4 text-green-700">
                Completado
              </h2>
              <Droppable droppableId="done">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[35vh] "
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
                            className={`bg-white p-4 rounded shadow mb-3 ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
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
                            <p className="text-sm text-gray-600">
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
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-bold text-xl mb-4 text-gray-800">
              Usuarios asignados al proyecto
            </h2>

            {project.users && project.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.users.map((user) => (
                  <div
                    key={user}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user
                        )}&background=random&color=fff&size=48`}
                        alt={`Avatar de ${user}`}
                        className="w-10 h-10 rounded-full border-2 border-white shadow"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.includes("@") ? "Miembro" : "Usuario"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No hay usuarios asignados a este proyecto
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Chat projectId={id} />
          </div>
        </div>
      </main>
    </>
  );
}
