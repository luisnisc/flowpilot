import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
}

export interface Columns {
  backlog: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
  [key: string]: Task[];
}

export interface TaskUpdatePayload {
  projectId: string;
  task: Task;
}

export interface UseProjectSyncReturn {
  columns: Columns;
  setColumns: React.Dispatch<React.SetStateAction<Columns>>;
  connected: boolean;
  updateTask: (taskId: string, newStatus: string, taskData: Task) => void;
}

export default function useProjectSync(
  projectId: string,
  initialColumns: Columns
): UseProjectSyncReturn {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const pendingUpdatesRef = useRef<
    { taskId: string; newStatus: string; taskData: Task }[]
  >([]);
  const [tasksInFlight, setTasksInFlight] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Si no hay ID de proyecto, no intentamos conectarnos
    if (!projectId) return;

    // Inicializar socket y conectarse al servidor
    const initSocket = async () => {
      try {
        console.log(
          "Inicializando conexión al socket para proyecto:",
          projectId
        );

        // Asegurarse de que el servidor socket está listo
        try {
          const socketCheck = await fetch("/api/socket");
          if (!socketCheck.ok) {
            throw new Error(
              `Error preparando el servidor socket: ${socketCheck.status}`
            );
          }
        } catch (fetchError) {
          console.error("Error preparando el servidor socket:", fetchError);
          // Continuamos de todos modos, ya que el servidor podría estar funcionando
        }

        // Crear conexión con opciones mejoradas
        socketRef.current = io("/kanban", {
          // No especificar path aquí, deja que Socket.IO use /socket.io por defecto
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ["polling", "websocket"],
        });

        // Manejar conexión establecida
        socketRef.current.on("connect", () => {
          console.log(
            "Socket conectado exitosamente, ID:",
            socketRef.current?.id
          );
          setConnected(true);
          reconnectAttemptRef.current = 0;

          // Unirse a la sala de sincronización del proyecto
          const roomName = `sync-${projectId}`;
          socketRef.current?.emit("joinProjectSync", projectId);
          console.log(`Enviado evento joinProjectSync para sala: ${roomName}`);

          // Procesar actualizaciones pendientes
          processQueuedUpdates();
        });

        // Mejorar el manejo de errores de conexión
        socketRef.current.on("connect_error", (error) => {
          console.error(
            "Error de conexión al socket:",
            error instanceof Error ? error.message : String(error)
          );

          reconnectAttemptRef.current += 1;
          setConnected(false);

          if (reconnectAttemptRef.current > maxReconnectAttempts) {
            console.error(
              `Máximo número de intentos de reconexión (${maxReconnectAttempts}) alcanzado`
            );
            socketRef.current?.disconnect();
          }
        });

        // Manejar desconexiones
        socketRef.current.on("disconnect", (reason) => {
          console.log(`Socket desconectado: ${reason}`);
          setConnected(false);
        });

        // Manejar reconexiones
        socketRef.current.on("reconnect", (attemptNumber) => {
          console.log(`Socket reconectado al intento ${attemptNumber}`);
          reconnectAttemptRef.current = 0;

          // Volver a unirse a la sala del proyecto
          const roomName = `sync-${projectId}`;
          socketRef.current?.emit("joinProjectSync", projectId);
          console.log(
            `Re-enviado evento joinProjectSync para sala: ${roomName}`
          );

          // Procesar actualizaciones pendientes
          processQueuedUpdates();
        });

        // Escuchar actualizaciones de tareas - modificar esto para evitar rebotes
        socketRef.current.on("taskUpdated", (task: Task) => {
          console.log("Tarea actualizada recibida:", task);

          // IMPORTANTE: Solo actualizar si la tarea no viene de una actualización propia reciente
          const isRecentLocalUpdate = pendingUpdatesRef.current.some(
            (update) =>
              update.taskId === task.id && update.newStatus === task.status
          );

          if (!isRecentLocalUpdate) {
            // Solo actualizar si no es una actualización que nosotros mismos acabamos de hacer
            updateLocalState(task);
          } else {
            console.log("Ignorando actualización redundante de tarea", task.id);

            // Limpiar esta actualización de la cola de pendientes
            pendingUpdatesRef.current = pendingUpdatesRef.current.filter(
              (update) =>
                !(update.taskId === task.id && update.newStatus === task.status)
            );
          }
        });

        // Escuchar errores del servidor
        socketRef.current.on("error", (errorData: any) => {
          console.error("Error recibido desde servidor socket:", errorData);
        });
      } catch (error) {
        console.error(
          "Error al inicializar la conexión de socket:",
          error instanceof Error ? error.message : "Error desconocido"
        );
        setConnected(false);
      }
    };

    // Función para actualizar el estado local al recibir actualizaciones
    const updateLocalState = (task: Task) => {
      try {
        setColumns((prevColumns) => {
          // Crear copia profunda para evitar mutaciones
          const newColumns = JSON.parse(JSON.stringify(prevColumns)) as Columns;

          // Mapeo de estado a columna
          const statusToColumn: Record<string, keyof Columns> = {
            pending: "backlog",
            in_progress: "in_progress",
            review: "review",
            done: "done",
          };

          const targetColumn = statusToColumn[task.status] || "backlog";

          // Eliminar tarea de todas las columnas
          Object.keys(newColumns).forEach((columnKey) => {
            const columnName = columnKey as keyof Columns;
            newColumns[columnName] = newColumns[columnName].filter(
              (t) => t.id !== task.id
            );
          });

          // Añadir tarea a la columna destino
          newColumns[targetColumn].push(task);

          return newColumns;
        });
      } catch (error) {
        console.error("Error actualizando estado local:", error);
      }
    };

    // Función para procesar la cola de actualizaciones pendientes
    const processQueuedUpdates = () => {
      if (
        !socketRef.current ||
        !socketRef.current.connected ||
        pendingUpdatesRef.current.length === 0
      ) {
        return;
      }

      console.log(
        `Procesando ${pendingUpdatesRef.current.length} actualizaciones pendientes`
      );

      pendingUpdatesRef.current.forEach((update) => {
        if (socketRef.current && socketRef.current.connected) {
          const { taskId, newStatus, taskData } = update;

          const updatedTask: Task = {
            ...taskData,
            status: newStatus as Task["status"],
          };

          socketRef.current.emit("updateTask", {
            projectId,
            task: updatedTask,
          });

          console.log(`Enviada actualización pendiente para tarea: ${taskId}`);
        }
      });

      pendingUpdatesRef.current = [];
    };

    initSocket();

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        console.log("Desconectando socket al desmontar componente");
        socketRef.current.disconnect();
      }
    };
  }, [projectId]);

  // Cada vez que cambie el estado de conexión, notificamos al usuario
  useEffect(() => {
    if (connected) {
      console.log("✅ Socket conectado para sincronización en tiempo real");
    } else {
      console.log(
        "⚠️ Socket desconectado, los cambios se aplicarán localmente"
      );
    }
  }, [connected]);

  // Función para emitir actualizaciones
  const updateTask = (
    taskId: string,
    newStatus: string,
    taskData: Task
  ): void => {
    console.log("Actualizando tarea:", taskId, "a estado:", newStatus);

    // Verificar que el estado sea válido
    if (!["pending", "in_progress", "review", "done"].includes(newStatus)) {
      console.error(`Estado de tarea no válido: ${newStatus}`);
      return;
    }

    // Crear una copia profunda del objeto de tarea para evitar referencias
    const updatedTask = JSON.parse(
      JSON.stringify({
        ...taskData,
        status: newStatus as Task["status"],
      })
    );

    // Actualizar el estado una sola vez para evitar rebotes
    setColumns((prevColumns) => {
      const newColumns = JSON.parse(JSON.stringify(prevColumns)) as Columns;

      // Mapeo de estado a nombre de columna
      const statusToColumn: Record<string, keyof Columns> = {
        pending: "backlog",
        in_progress: "in_progress",
        review: "review",
        done: "done",
      };

      // Eliminar la tarea de todas las columnas primero
      Object.keys(newColumns).forEach((columnKey) => {
        const columnName = columnKey as keyof Columns;
        newColumns[columnName] = newColumns[columnName].filter(
          (t) => t.id !== taskId
        );
      });

      // Añadir la tarea a la columna correcta
      const targetColumn = statusToColumn[newStatus] || "backlog";
      newColumns[targetColumn].push(updatedTask);

      return newColumns;
    });

    // Emitir el evento al servidor si estamos conectados
    if (socketRef.current && connected) {
      try {
        socketRef.current.emit("updateTask", {
          projectId,
          task: {
            ...updatedTask,
            id: taskId,
          },
        });
        console.log("Evento Socket.IO enviado para actualizar tarea", taskId);
      } catch (err) {
        console.error("Error emitiendo evento updateTask:", err);
        // Si hay un error con el socket, intentamos la API
        updateTaskViaAPI(taskId, newStatus);
      }
    } else {
      console.log("Socket desconectado, usando API REST como fallback");
      updateTaskViaAPI(taskId, newStatus);
    }

    updateTaskViaAPI(taskId, newStatus);
  };

  // Actualización mediante API REST como fallback cuando el socket está desconectado
  const updateTaskViaAPI = async (taskId: string, newStatus: string) => {
    try {
      console.log(
        `[API] Intentando actualizar tarea ${taskId} a estado ${newStatus}`
      );

      // Registrar la URL y los datos enviados
      console.log(`[API] URL: /api/tasks/${taskId}`);
      console.log("[API] Payload:", { status: newStatus });

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      // Leer el texto de la respuesta antes de intentar parsear como JSON
      const responseText = await response.text();
      console.log(`[API] Respuesta (status ${response.status}):`, responseText);

      // Intentar parsear como JSON si es posible
      let responseData;
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log("[API] Datos de respuesta:", responseData);
        }
      } catch (e) {
        console.warn("[API] La respuesta no es un JSON válido");
      }

      if (!response.ok) {
        console.error(`[API] Error ${response.status}: ${responseText}`);
        return false;
      }

      console.log("✅ [API] Tarea actualizada correctamente");
      return true;
    } catch (error) {
      console.error("[API] Error en petición:", error);
      return false;
    }
  };

  // Modificar onDragEnd para ser más robusto
  const onDragEnd = (result: any) => {
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

      const updatedTask: Task = {
        ...draggedTask,
        status: columnToStatus[destination.droppableId],
      };

      updateTask(
        draggedTask.id,
        columnToStatus[destination.droppableId],
        updatedTask
      );

      // También actualizar en la base de datos como respaldo
      updateTaskViaAPI(draggedTask.id, columnToStatus[destination.droppableId]);
    } catch (error) {
      console.error("Error en onDragEnd:", error);
    }
  };

  return { columns, setColumns, connected, updateTask };
}
