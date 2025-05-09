"use client";
import { Draggable } from "@hello-pangea/dnd";
import { useSession } from "next-auth/react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "review" | "done";
    priority: "low" | "medium" | "high";
    assignedTo?: string;
    assignedToName?: string;
  };
  index: number;
}

export default function TaskCard({ task, index }: TaskCardProps) {
  const { data: session } = useSession();

  // Determinar si el usuario puede arrastrar esta tarea
  const isAdmin = session?.user?.role === "admin";
  const isAssignedToUser = task.assignedTo === session?.user?.email;
  const canDrag = isAdmin || isAssignedToUser;

  return (
    <Draggable
      key={task.id}
      draggableId={task.id}
      index={index}
      isDragDisabled={!canDrag}
    >
      {(provided, snapshot) => (
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
}
