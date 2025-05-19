"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiLoader, FiCheck, FiAlertCircle } from "react-icons/fi";
import { useSession } from "next-auth/react";

interface User {
  email: string;
  name: string;
  image?: string;
}

export default function AddProjectForm() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: false,
    description: false
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) {
          throw new Error("Error obteniendo usuarios");
        }
        
        const data = await res.json();
        setAllUsers(data.filter((user: User) => user.email !== session?.user?.email));
      } catch (error) {
        console.error("Error cargando usuarios:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los usuarios",
          confirmButtonColor: "#3B82F6",
        });
      }
    };
    
    if (session?.user?.email) {
      fetchUsers();
    }
  }, [session]);

  const validateForm = () => {
    const errors = {
      name: !name.trim(),
      description: !description.trim()
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleUserToggle = (email: string) => {
    setUsers(prevUsers => {
      if (prevUsers.includes(email)) {
        return prevUsers.filter(e => e !== email);
      } else {
        return [...prevUsers, email];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa todos los campos obligatorios",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const projectUsers = [
        ...(session?.user?.email ? [session.user.email] : []),
        ...users
      ];
      
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          users: projectUsers,
          deadline: deadline || undefined,
          status: "active"
        }),
      });
      
      if (!res.ok) {
        throw new Error("Error al crear el proyecto");
      }
      Swal.fire({
        icon: "success",
        title: "¡Proyecto creado!",
        text: "El proyecto se ha creado correctamente",
        confirmButtonColor: "#3B82F6",
      }).then(() => {
        router.push(`/projects`);
      });
    } catch (error) {
      console.error("Error creando proyecto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear el proyecto. Inténtalo de nuevo.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-black h-screen">
      <h1 className="text-2xl font-bold mb-6">Crear nuevo proyecto</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">Información básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del proyecto *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Nombre del proyecto"
                  maxLength={100}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" />
                    Este campo es obligatorio
                  </p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border ${
                    formErrors.description ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Describe el propósito y objetivos del proyecto"
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" />
                    Este campo es obligatorio
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {description.length}/500 caracteres
                </p>
              </div>
              
            </div>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">Añadir miembros al proyecto</h2>
            
            {allUsers.length === 0 ? (
              <div className="text-gray-500 italic">
                No hay usuarios disponibles para añadir
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Selecciona los usuarios que quieres añadir a este proyecto.
                  Tú serás añadido automáticamente como miembro y administrador.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allUsers.map((user) => (
                    <div
                      key={user.email}
                      className={`
                        flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${users.includes(user.email) 
                          ? "border-blue-400 bg-blue-50" 
                          : "border-gray-200 hover:bg-gray-50"}
                      `}
                      onClick={() => handleUserToggle(user.email)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <img
                          src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random&color=fff&size=32`}
                          alt={user.name || user.email}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="ml-2">
                        <div className={`
                          w-5 h-5 rounded-full flex items-center justify-center
                          ${users.includes(user.email) 
                            ? "bg-blue-500" 
                            : "border border-gray-300"}
                        `}>
                          {users.includes(user.email) && (
                            <FiCheck className="text-white text-sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  {users.length} usuario{users.length !== 1 ? "s" : ""} seleccionado{users.length !== 1 ? "s" : ""}
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <>
                  <FiLoader className="inline-block mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear proyecto"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}