"use client";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  assignedToName?: string;
}

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  backgroundColor: string;
  textColor: string;
}

export default function TaskColumn({
  id,
  title,
  tasks,
  backgroundColor,
  textColor,
}: TaskColumnProps) {
  return (
    <div className={`${backgroundColor} rounded-lg shadow p-3 md:p-4`}>
      <h2
        className={`font-bold text-base md:text-lg mb-3 md:mb-4 ${textColor}`}
      >
        {title}
      </h2>
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[20vh] md:min-h-[35vh]"
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
