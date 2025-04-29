import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function SideBar() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname(); 

  const handleSave = () => {
    setShowModal(false);
  };

  const isActive = (path:string) => {
    return pathname === path ? "bg-gray-700 animate-spin" : "";
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
              <img src={session.user.image} alt="userImage" />
            </div>
          </div>
        ) : (
          "Bienvenido"
        )}
        <div>{session?.user?.name}</div>
        <button
          title="userConfig"
          className="hover:cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <Image
            src="/userConfig.svg"
            alt="userConfig"
            width={20}
            height={20}
          />
        </button>
      </div>
      <div className="h-0.25 w-full bg-white mb-6"></div>
      <nav className="w-full">
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
      {session.user.role === "admin" && (
        <button className="btn-admin">Acción Admin</button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Configuración de usuario</h2>
            <label className="block mb-2 text-gray-700">Nombre</label>
            <input
              type="text"
              defaultValue={session?.user?.name}
              className="w-full mb-4 px-3 py-2 border rounded input"
            />
            <label className="block mb-2 text-gray-700">Email</label>
            <input
              type="email"
              defaultValue={session?.user?.email}
              className="w-full mb-4 px-3 py-2 border rounded input"
            />
            <label className="block mb-2 text-gray-700">Rol</label>
            <select className="w-full mb-4 px-3 py-2 border rounded input select">
              <option value="admin">Administrador</option>
              <option value="user">Usuario</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
