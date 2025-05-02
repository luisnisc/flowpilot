import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
}

interface Columns {
  backlog: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
}

export default function useProjectSync(
  projectId: string,
  initialColumns: Columns
) {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!projectId) return;

    // Inicializar socket y conectarse al servidor
    const initSocket = async () => {
      try {
        // Asegurarse de que el servidor socket está listo
        await fetch("/api/socket");

        // Crear conexión
        socketRef.current = io({
          path: "/api/socket",
          addTrailingSlash: false,
        });

        // Configurar eventos
        socketRef.current.on("connect", () => {
          console.log("Conectado al servidor de sincronización de proyectos");
          setConnected(true);

          // Unirse a la sala del proyecto
          socketRef.current.emit("joinProjectSync", projectId);
        });

        // Escuchar actualizaciones de tareas
        socketRef.current.on("taskUpdated", (updatedTask: Task) => {
          console.log("Tarea actualizada recibida:", updatedTask);

          // Verificar que la tarea tiene un estado válido
          if (!updatedTask || !updatedTask.status) {
            console.error("Tarea recibida inválida o sin estado:", updatedTask);
            return;
          }

          // Mapeo de estado a nombre de columna
          const statusToColumn: Record<string, keyof Columns> = {
            pending: "backlog",
            in_progress: "in_progress",
            review: "review",
            done: "done",
          };

          // Determinar en qué columna debe estar esta tarea
          const targetColumn = statusToColumn[updatedTask.status] || "backlog";

          setColumns((prevColumns) => {
            // Crear una copia profunda del estado anterior
            const newColumns = JSON.parse(JSON.stringify(prevColumns));

            // Eliminar la tarea de todas las columnas
            Object.keys(newColumns).forEach((columnKey) => {
              const columnName = columnKey as keyof Columns;
              newColumns[columnName] = newColumns[columnName].filter(
                (task) => task.id !== updatedTask.id
              );
            });

            // Añadir la tarea a la columna correcta
            newColumns[targetColumn].push(updatedTask);

            return newColumns;
          });
        });

        // Escuchar actualizaciones completas del tablero
        socketRef.current.on("boardUpdated", (updatedColumns: Columns) => {
          console.log("Tablero actualizado recibido:", updatedColumns);
          setColumns(updatedColumns);
        });

        // Manejar desconexiones
        socketRef.current.on("disconnect", () => {
          console.log("Desconectado del servidor de sincronización");
          setConnected(false);
        });
      } catch (error) {
        console.error("Error al inicializar la conexión de socket:", error);
        setConnected(false);
      }
    };

    initSocket();

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId]);

  // Función para emitir cambios de tareas
  const updateTask = (taskId: string, newStatus: string, taskData: Task) => {
    if (!socketRef.current || !connected) {
      console.error("No se puede actualizar tarea - socket desconectado");
      return;
    }

    const updatedTask = {
      ...taskData,
      status: newStatus,
    };

    console.log(
      "Emitiendo actualización de tarea:",
      JSON.stringify(updatedTask)
    );

    // Emitir el evento al servidor
    socketRef.current.emit("updateTask", {
      projectId,
      task: updatedTask,
    });
  };

  return { columns, setColumns, connected, updateTask };
}
