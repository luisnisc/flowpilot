"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import UserStatsWidget from "./UserStatsWidget";
import {
  FiMenu,
  FiX,
  FiHome,
  FiFolder,
  FiCheckSquare,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
interface UserSettings {
  id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function SideBar() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: "",
    email: "",
    role: "user",
  });
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (session?.user) {
      setUserSettings({
        id: session.user.email || undefined,
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "user",
      });
    }
  }, [session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const userEmail = session?.user?.email;

    if (!userEmail) {
      console.error("No se pudo obtener el identificador del usuario");
      return;
    }

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(userEmail)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userSettings),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedUser = await response.json();
      if (
        userEmail !== userSettings.email ||
        session?.user?.name !== userSettings.name
      ) {
        const syncResponse = await fetch("/api/users/sync-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldEmail: userEmail,
            newEmail: userSettings.email,
            oldName: session?.user?.name,
            newName: userSettings.name,
          }),
        });

        if (!syncResponse.ok) {
          console.warn(
            "La sincronización de datos en proyectos no fue completamente exitosa"
          );
        } else {
          const syncResult = await syncResponse.json();
          console.log("Sincronización completada:", syncResult);
        }
      }

      alert(
        "Configuración guardada correctamente. La página se recargará para aplicar los cambios."
      );
      window.location.reload();
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      alert("No se pudo guardar la configuración: " + (error as Error).message);
    }
  };

  const isActive = (path: string): string => {
    return pathname?.includes(path) ? "bg-gray-700" : "";
  };

  const mobileToggle = (
    <button
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="fixed top-4 left-4 p-2 bg-gray-800 rounded-md text-white z-50 md:hidden"
      aria-label="Toggle navigation menu"
    >
      {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
    </button>
  );

  const sidebarContent = (
    <>
    <Link href="/dashboard" className="w-full mb-4 md:mb-6">
      <div className="flex justify-center w-full mb-6 md:mb-0">
          <Image
            src="/logoFlowPilot.png"
            alt="logoFlowPilot"
            width={150}
            height={150}
            className="md:mt-[-5em] w-auto h-auto"
          />
      </div>
      </Link>
      <div className="mb-4 md:mt-[-4em] flex flex-row items-center w-full text-center gap-8 justify-center mt-4">
        {session?.user?.image ? (
          <div className="avatar mb-2">
            <div className="w-12 rounded-full overflow-hidden mx-auto">
              <img
                src={session.user.image}
                alt="Imagen de perfil"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : null}
        <div className="text-center mb-2">
          {session?.user?.name || "Usuario"}
        </div>

        <button
          title="Cerrar sesión"
          onClick={() => signOut()}
          className="flex items-center justify-center px-2 py-2 text-red-500 rounded hover:bg-gray-600 cursor-pointer"
        >
          <FiLogOut size={18} />
        </button>
      </div>
      {session?.user && (
        <div className="w-full px-3 mt-2 mb-4">
          <div className="bg-gray-700 rounded-md p-2">
            <div className="text-xs text-gray-300 mb-1">Tareas completadas</div>
            <UserStatsWidget email={session.user.email || ""} />
          </div>
        </div>
      )}

      <div className="h-0.25 w-full bg-white my-4 md:mb-6"></div>

      <nav className="w-full text-center" aria-label="Navegación principal">
        <ul className="flex flex-col space-y-2 md:space-y-4 items-center">
          <li className="w-full">
            <Link
              href="/dashboard"
              className={`flex items-center justify-center px-4 py-3 md:py-2 hover:bg-gray-700 rounded w-full ${isActive(
                "/dashboard"
              )}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiHome className="mr-2" size={18} />
              <span>Inicio</span>
            </Link>
          </li>
          <li className="w-full">
            <Link
              href="/projects"
              className={`flex items-center justify-center px-4 py-3 md:py-2 hover:bg-gray-700 rounded w-full ${isActive(
                "/projects"
              )}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiFolder className="mr-2" size={18} />
              <span>Proyectos</span>
            </Link>
          </li>
          <li className="w-full">
            <Link
              href="/tasks"
              className={`flex items-center justify-center px-4 py-3 md:py-2 hover:bg-gray-700 rounded w-full ${isActive(
                "/tasks"
              )}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiCheckSquare className="mr-2" size={18} />
              <span>Tareas</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {mobileToggle}

      <div className="hidden md:block fixed left-0 top-0 w-1/6 h-screen bg-gray-800 text-white flex flex-col items-center py-8">
        {sidebarContent}
      </div>

      <div
        className={`fixed inset-0 z-40 md:hidden ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        <div className="absolute top-0 left-0 w-4/5 max-w-xs h-screen bg-gray-800 text-white flex flex-col items-center py-16 px-2 overflow-y-auto">
          {sidebarContent}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 "
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md mx-4 md:mx-0 md:w-96 text-white">
            <h2 id="modal-title" className="text-xl font-bold mb-4 text-black">
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
                  className="w-full px-3 py-2 border rounded input text-white"
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
                  className="w-full px-3 py-2 border rounded input text-white"
                  aria-describedby="email-description"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
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
    </>
  );
}
