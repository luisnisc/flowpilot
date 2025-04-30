"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SideBar from './SideBar';

export default function AddTaskForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.email) {
      // Establecer el email de la sesión como valor por defecto
      setAssignedTo(session.user.email);
      fetchProjects();
    }
  }, [status, router, session]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Error al obtener proyectos");
      }

      const data = await res.json();
      setProjects(data);
      
      // Si hay proyectos, seleccionar el primero por defecto
      if (data.length > 0) {
        setProject(data[0]._id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("No se pudieron cargar los proyectos");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !project) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          project,
          priority,
          assignedTo,
          status: "pending" // Estado inicial para nuevas tareas
        }),
      });

      if (!res.ok) {
        throw new Error("Error al crear la tarea");
      }

      // Redireccionar a la lista de tareas
      router.push("/tasks");
      router.refresh(); // Refrescar la página para mostrar la nueva tarea
    } catch (err) {
      console.error("Error creating task:", err);
      setError("No se pudo crear la tarea. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <SideBar />
      <main className="flex flex-col h-screen bg-gray-100 ml-[19.66667%] p-6">
        <div className="max-w-2xl mx-auto w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Nueva Tarea</h1>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Título*
              </label>
              <input
                id="title"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Descripción*
              </label>
              <textarea
                id="description"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="project">
                Proyecto*
              </label>
              {projects.length > 0 ? (
                <select
                  id="project"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  required
                >
                  {projects.map((proj) => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-red-500">
                  No hay proyectos disponibles. Crea un proyecto primero.
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
                Prioridad
              </label>
              <select
                id="priority"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assignedTo">
                Asignado a
              </label>
              <input
                id="assignedTo"
                type="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Email del responsable"
              />
              <p className="text-xs text-gray-500 mt-1">
                Por defecto, esta tarea está asignada a ti.
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || projects.length === 0}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  submitting || projects.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Guardando...' : 'Guardar tarea'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}