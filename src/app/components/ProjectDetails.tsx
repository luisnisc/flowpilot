"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SideBar from "./SideBar";

// Interfaces para tipado
interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high";
  members?: string[];
}

interface Project {
  _id: string;
  name: string;
  description: string;
  tasks?: string;
  users?: string[];
  status?: string;
}

// Estado inicial para demostración
const initialData = {
  backlog: [
    {
      id: "p1",
      title: "Rediseño de UI",
      description: "Actualizar la interfaz para mejorar UX",
      status: "backlog",
      priority: "high",
    },
    {
      id: "p2",
      title: "API de usuarios",
      description: "Implementar endpoints para gestión de usuarios",
      status: "backlog",
      priority: "medium",
    },
  ],
  in_progress: [
    {
      id: "p3",
      title: "Integración con MongoDB",
      description: "Conectar la aplicación con la base de datos",
      status: "in_progress",
      priority: "high",
    },
    {
      id: "p4",
      title: "Sistema de autenticación",
      description: "Implementar login con múltiples proveedores",
      status: "in_progress",
      priority: "high",
    },
  ],
  review: [
    {
      id: "p5",
      title: "Tablero Kanban",
      description: "Crear vista de proyectos con arrastrar y soltar",
      status: "review",
      priority: "medium",
    },
  ],
  done: [
    {
      id: "p6",
      title: "Configuración inicial",
      description: "Setup del proyecto Next.js y dependencias",
      status: "done",
      priority: "low",
    },
  ],
};

interface ProjectDetailsProps {
  id: string;
}

export default function ProjectDetails({ id }: ProjectDetailsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [columns, setColumns] = useState(initialData);

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
      } else {
        setProject(selectedProject);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load project details");
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!project) {
    return <div>No se encontró el proyecto</div>;
  }

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Si no hay destino (soltado fuera del área) o si no ha cambiado de posición
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Columna de origen y destino
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];

    // Encontrar el proyecto que se está arrastrando
    const draggedProject = sourceColumn.find(
      (task) => task.id === draggableId
    );
    if (!draggedProject) return;

    // Actualizar el estado del proyecto si se cambió de columna
    const updatedProject = {
      ...draggedProject,
      status: destination.droppableId,
    };

    // Crear nuevas columnas (inmutabilidad)
    const newSourceColumn = [...sourceColumn];
    newSourceColumn.splice(source.index, 1);

    // Si es la misma columna
    if (source.droppableId === destination.droppableId) {
      newSourceColumn.splice(destination.index, 0, updatedProject);
      setColumns({
        ...columns,
        [source.droppableId]: newSourceColumn,
      });
    }
    // Si es una columna diferente
    else {
      const newDestColumn = [...destColumn];
      newDestColumn.splice(destination.index, 0, updatedProject);
      setColumns({
        ...columns,
        [source.droppableId]: newSourceColumn,
        [destination.droppableId]: newDestColumn,
      });
    }

    // Aquí podrías realizar una llamada API para actualizar el estado del proyecto
    // updateProjectStatus(draggedProject.id, destination.droppableId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-200 text-black ml-[19.66667%] p-6">
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
          {/* Columna: Backlog */}
          <div className="bg-gray-100 rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-4 text-gray-700">
              Por hacer
            </h2>
            <Droppable droppableId="backlog">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[70vh]"
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

          {/* Columna: En progreso */}
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-4 text-blue-700">
              En progreso
            </h2>
            <Droppable droppableId="in_progress">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[70vh]"
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

          {/* Columna: Revisión */}
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-4 text-yellow-700">
              En revisión
            </h2>
            <Droppable droppableId="review">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[70vh]"
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

          {/* Columna: Finalizado */}
          <div className="bg-green-50 rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-4 text-green-700">
              Completado
            </h2>
            <Droppable droppableId="done">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[70vh]"
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
    </div>
  );
}