"use client";
import Link from "next/link";

interface ProjectHeaderProps {
  id: string;
  name: string;
  description: string;
  isAdmin: boolean;
}

export default function ProjectHeader({
  id,
  name,
  description,
  isAdmin,
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">{name || "Cargando..."}</h1>
        <p className="text-gray-600 mb-4 md:mb-0">{description || ""}</p>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        {/* Botón para añadir tarea (todos los usuarios) */}
        <Link href={`/addTask?projectId=${id}`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Añadir tarea
          </button>
        </Link>

        {/* Botones solo para administradores */}
        {isAdmin && (
          <>
            {/* Botón para editar proyecto */}
            <Link href={`/projects/edit/${id}`}>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center text-sm">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  ></path>
                </svg>
                Editar proyecto
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
