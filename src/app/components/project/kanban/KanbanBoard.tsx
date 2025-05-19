"use client";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import TaskColumn from "./TaskColumn";
import { useEffect } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  assignedToName?: string;
}

interface Columns {
  backlog: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
  [key: string]: Task[];
}

interface KanbanBoardProps {
  columns: Columns;
  onDragEnd: (result: DropResult) => void;
}

export default function KanbanBoard({ columns, onDragEnd }: KanbanBoardProps) {
  useEffect(() => {
    console.log("Estado actual del tablero:", {
      backlog: columns.backlog.length,
      in_progress: columns.in_progress.length,
      review: columns.review.length,
      done: columns.done.length,
    });

    if (columns.review.length > 0) {
      console.log(
        "Tareas en review:",
        columns.review.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
        }))
      );
    }
  }, [columns]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    console.log("Movimiento detectado:", {
      taskId: draggableId,
      from: source.droppableId,
      to: destination.droppableId,
    });

    const columnToStatus = {
      backlog: "pending",
      in_progress: "in_progress",
      review: "review",
      done: "done",
    };

    if (!Object.keys(columnToStatus).includes(destination.droppableId)) {
      console.error("Columna de destino no válida:", destination.droppableId);
      return;
    }

    const taskBeingMoved = columns[source.droppableId].find(
      (task) => task.id === draggableId
    );

    if (!taskBeingMoved) {
      console.error("No se encontró la tarea a mover:", draggableId);
      return;
    }

    console.log("Conversión de columna a estado:", {
      columnaDestino: destination.droppableId,
      estadoResultante:
        columnToStatus[destination.droppableId as keyof typeof columnToStatus],
    });

    onDragEnd(result);
  };

  const columnConfig = [
    {
      id: "backlog",
      title: "Por hacer",
      backgroundColor: "bg-gray-100",
      textColor: "text-gray-700",
    },
    {
      id: "in_progress",
      title: "En progreso",
      backgroundColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      id: "review",
      title: "En revisión",
      backgroundColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    {
      id: "done",
      title: "Completado",
      backgroundColor: "bg-green-50",
      textColor: "text-green-700",
    },
  ];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columnConfig.map((column) => (
          <TaskColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={columns[column.id]}
            backgroundColor={column.backgroundColor}
            textColor={column.textColor}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
