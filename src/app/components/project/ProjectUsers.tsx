"use client";
import { use, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";

interface User {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  role?: string;
  image?: string;
}

interface ProjectUsersProps {
  projectId: string;
  users: (string | User)[];
  isAdmin: boolean;
  onlineUsers: string[];
  userEmail?: string;
}

export default function ProjectUsers({
  projectId,
  users,
  isAdmin,
  onlineUsers,
  userEmail,
}: ProjectUsersProps) {
  const { data: session } = useSession();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ email: string; name: string; role?: string; image?: string }>
  >([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUserDisplayName = (user: string | User): string => {
    if (typeof user === "string") {
      return user.split("@")[0];
    } else {
      return user.name || user.email.split("@")[0];
    }
  };

  const getUserEmail = (user: string | User): string => {
    if (typeof user === "string") {
      return user;
    } else {
      return user.email;
    }
  };

  useEffect(() => {
    fetch("/api/users?projectId=" + projectId)
      .then((res) => res.json())
      .then((data) => {
        setAvailableUsers(data);
      });
  }, [projectId]);

  const fetchAvailableUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users?projectId=${projectId}`);

      if (!res.ok) {
        throw new Error("Error al obtener usuarios disponibles");
      }

      const data = await res.json();
      const filteredUsers = data.filter(
        (user: User) =>
          user.email !== session?.user?.email && !users.includes(user.email)
      );
      setAvailableUsers(filteredUsers);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error fetching available users:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los usuarios disponibles",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: selectedUsers, action: "add" }),
      });

      if (!res.ok) {
        throw new Error("Error al añadir usuarios");
      }

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Usuarios añadidos correctamente",
        confirmButtonColor: "#3B82F6",
      }).then((result) => {
        if (result.isConfirmed) {
          setShowAddUserModal(false);
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Error adding users to project:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron añadir los usuarios al proyecto",
        confirmButtonColor: "#3B82F6",
      });
    }
  };

  const handleRemoveUser = async (userEmail: string) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: `¿Quieres eliminar a ${userEmail} del proyecto?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3B82F6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) return;

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          removeUser: userEmail,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al eliminar usuario");
      }

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Usuario eliminado correctamente",
        confirmButtonColor: "#3B82F6",
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error removing user from project:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el usuario del proyecto",
        confirmButtonColor: "#3B82F6",
      });
    }
  };

  const isUserAdmin = (userEmail: string): boolean => {
    const user = availableUsers.find((u) => u.email === userEmail);
    return user?.role === "admin";
  };

  return (
    <>
      <div id="usersList" className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Usuarios del Proyecto
          </h2>
          {isAdmin && (
            <button
              onClick={() => {
                fetchAvailableUsers();
                setShowAddUserModal(true);
              }}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Añadir usuarios
            </button>
          )}
        </div>

        {users && users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((user, index) => {
              const username = getUserDisplayName(user);
              const email = getUserEmail(user).toLowerCase().trim();
              const isCurrentUser = email === userEmail?.toLowerCase().trim();
              const isUserAnAdmin = isUserAdmin(email);
              const isOnline = onlineUsers.includes(email);

              return (
                <div
                  key={email}
                  className={`flex items-center p-3 rounded-lg border ${
                    isCurrentUser
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  } hover:shadow-md transition-all relative`}
                >
                  <div className="relative">
                    <img
                      src={
                        availableUsers.find((u) => u.email === email)?.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          username
                        )}&background=random&color=fff&size=32`
                      }
                      alt={username}
                      className={`w-12 h-12 rounded-full ${
                        isCurrentUser ? "ring-2 ring-blue-500" : ""
                      }`}
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
                        isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={isOnline ? "En línea" : "Desconectado"}
                    ></span>
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="text-sm font-medium text-gray-900">
                      {username}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Tú
                        </span>
                      )}
                      {isUserAnAdmin && (
                        <span className="ml-1.5 text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]">
                      {email}
                      {isOnline && (
                        <span className="ml-1.5 text-xs font-normal text-green-600">
                          • en línea
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de eliminar - solo visible para administradores y no para usuarios admin */}
                  {isAdmin && !isUserAnAdmin && (
                    <button
                      onClick={() => handleRemoveUser(email)}
                      className="text-red-500 hover:text-red-700 ml-auto cursor-pointer"
                      title="Eliminar usuario del proyecto"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              No hay usuarios asignados a este proyecto.
            </p>
            {isAdmin && (
              <button
                onClick={() => {
                  fetchAvailableUsers();
                  setShowAddUserModal(true);
                }}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Añadir el primer usuario
              </button>
            )}
          </div>
        )}

        {users && users.length >= 3 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-wrap justify-between text-sm text-gray-600">
              <div className="flex items-center mb-2">
                <svg
                  className="w-4 h-4 mr-1 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Total: {users.length} usuarios
              </div>
              <div className="flex items-center mb-2">
                <svg
                  className="w-4 h-4 mr-1 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Actualizado: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Avatares apilados para efecto visual */}
            <div className="flex -space-x-2 overflow-hidden mt-3">
              {users.slice(0, 5).map((user, index) => {
                let userImage = "";

                if (typeof user === "string") {
                  const availableUser = availableUsers.find(
                    (u) => u.email === user
                  );
                  userImage = availableUser?.image || "";
                } else {
                  userImage = user.image || "";
                }

                const avatarUrl =
                  userImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    getUserDisplayName(user)
                  )}&background=random&color=fff&size=32`;

                return (
                  <img
                    key={getUserEmail(user)}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src={avatarUrl}
                    alt={getUserDisplayName(user)}
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        getUserDisplayName(user)
                      )}&background=random&color=fff&size=32`;
                    }}
                  />
                );
              })}
              {users.length > 5 && (
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 ring-2 ring-white text-xs font-medium text-gray-800">
                  +{users.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Añadir usuarios al proyecto
              </h3>
              <button
                title="Cerrar"
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Selecciona los usuarios que quieres añadir a este proyecto
              </p>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {availableUsers.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border rounded">
                      {availableUsers.map((user) => (
                        <div
                          key={user.email}
                          className="flex items-center p-2 border-b last:border-b-0 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            id={`user-${user.email}`}
                            checked={selectedUsers.includes(user.email)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers((prev) => [
                                  ...prev,
                                  user.email,
                                ]);
                              } else {
                                setSelectedUsers((prev) =>
                                  prev.filter((email) => email !== user.email)
                                );
                              }
                            }}
                            className="mr-2"
                          />
                          <label
                            htmlFor={`user-${user.email}`}
                            className="flex items-center cursor-pointer flex-1"
                          >
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.name || user.email
                              )}&size=32&background=random`}
                              alt={user.name || user.email}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                            <div>
                              <div>{user.name || "Usuario"}</div>
                              <div className="text-xs text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No hay usuarios disponibles para añadir
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                disabled={selectedUsers.length === 0}
              >
                Añadir seleccionados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
