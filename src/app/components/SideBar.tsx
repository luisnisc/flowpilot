"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// Definimos una interfaz para los datos de usuario
interface UserSettings {
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function SideBar() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    role: "user",
  });
  const pathname = usePathname();

  // Handler para actualizar los campos del formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar la configuración del usuario
    // Por ejemplo, una llamada a la API
    console.log("Guardando configuración:", userSettings);
    setShowModal(false);
  };

  const isActive = (path: string): string => {
    return pathname === path ? "bg-gray-700" : "";
  };

  return (
    <div
      id="sidebar"
      className="fixed left-0 top-0 w-1/6 h-screen bg-gray-800 text-white flex flex-col items-center py-8"
    >
      <Image
        src="/logoFlowPilot.png"
        alt="logoFlowPilot"
        width={250}
        height={250}
        className="mt-[-5em]"
      />
      <div className="mb-4 mt-[-4em] flex flex-row items-center space-x-6">
        {session?.user?.image ? (
          <div className="avatar">
            <div className="w-12 rounded-full overflow-hidden">
              <img
                src={session.user.image}
                alt="Imagen de perfil"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <span className="text-sm">Bienvenido</span>
        )}
        <div>{session?.user?.name || "Usuario"}</div>
        <button
          title="Configuración de usuario"
          className="hover:cursor-pointer"
          onClick={() => setShowModal(true)}
          aria-label="Abrir configuración de usuario"
        >
          <Image
            src="/userConfig.svg"
            alt="Configuración"
            width={20}
            height={20}
          />
        </button>
      </div>
      <div className="h-0.25 w-full bg-white mb-6"></div>
      <nav className="w-full" aria-label="Navegación principal">
        <ul className="flex flex-col space-y-4">
          <li>
            <Link
              href="/dashboard"
              className={`block w-full text-center py-2 hover:bg-gray-700 rounded ${isActive(
                "/dashboard"
              )}`}
            >
              Inicio
            </Link>
          </li>
          <li>
            <Link
              href="/projects"
              className={`block w-full text-center py-2 hover:bg-gray-700 rounded ${isActive(
                "/projects"
              )}`}
            >
              Proyectos
            </Link>
          </li>
          <li>
            <Link
              href="/tasks"
              className={`block w-full text-center py-2 hover:bg-gray-700 rounded ${isActive(
                "/tasks"
              )}`}
            >
              Tareas
            </Link>
          </li>
        </ul>
      </nav>
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg p-6 w-96 text-black">
            <h2 id="modal-title" className="text-xl font-bold mb-4">
              Configuración de usuario
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="mb-4">
                <label htmlFor="name" className="block mb-2 text-gray-700">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={userSettings.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded input"
                  aria-describedby="name-description"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={userSettings.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded input"
                  aria-describedby="email-description"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="role" className="block mb-2 text-gray-700">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  value={userSettings.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded input select"
                >
                  <option value="admin">Administrador</option>
                  <option value="user">Usuario</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
