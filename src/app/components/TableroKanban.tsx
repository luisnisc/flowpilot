"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import SideBar from "./SideBar";
import { FiMenu, FiX } from "react-icons/fi";
import useProjectSync from "@/hooks/useProjectSync";
import dynamic from "next/dynamic";
import { FiPieChart } from "react-icons/fi"; // Añadir a tus importaciones de iconos
import Swal from "sweetalert2";
import usePresence from "@/hooks/usePresence";

export default function TableroKanban() {
     const { columns, setColumns, connected, updateTask } = useProjectSync(
        id,
        emptyColumns
      );
  return (
    <div>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-100 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-gray-700">
                    Por hacer
                  </h2>
                  <Droppable droppableId="backlog">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.backlog.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="bg-blue-50 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-blue-700">
                    En progreso
                  </h2>
                  <Droppable droppableId="in_progress">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.in_progress.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="bg-yellow-50 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-yellow-700">
                    En revisión
                  </h2>
                  <Droppable droppableId="review">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.review.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="bg-green-50 rounded-lg shadow p-3 md:p-4">
                  <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-green-700">
                    Completado
                  </h2>
                  <Droppable droppableId="done">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[20vh] md:min-h-[35vh]"
                      >
                        {columns.done.map((task, index) => {
                          const isAdmin = session?.user?.role === "admin";
                          const isAssignedToUser =
                            task.assignedTo === session?.user?.email;
                          const canDrag = isAdmin || isAssignedToUser;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canDrag} // Deshabilita arrastre si no es admin ni asignado
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 md:p-4 rounded shadow mb-2 md:mb-3 ${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } ${
                                    !canDrag
                                      ? "opacity-80 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {/* Contenido existente de la tarjeta */}
                                  <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <div className="flex items-center">
                                      {/* Avatar del usuario asignado */}
                                      {task.assignedTo && (
                                        <div className="flex-shrink-0 mr-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              task.assignedToName ||
                                                task.assignedTo
                                            )}&background=random&color=fff&size=32`}
                                            alt={`${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            title={`Asignado a: ${
                                              task.assignedToName ||
                                              task.assignedTo
                                            }`}
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-sm md:text-base text-clip max-w-[150px]">
                                        {task.title}
                                      </h3>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Indicador visual cuando no se puede arrastrar */}
                                  {!canDrag && (
                                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Solo el propietario puede mover esta tarea
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>

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

              {project.users && project.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {project.users.map((user, index) => {
                    // Verificar el tipo de usuario y extraer los datos necesarios
                    const username = getUserDisplayName(user);
                    const userEmail = getUserEmail(user).toLowerCase().trim(); // Normalizar aquí también
                    const isCurrentUser =
                      userEmail === session?.user?.email?.toLowerCase().trim();

                    // Verificar si el usuario está en línea
                    const isOnline = onlineUsers.includes(userEmail);

                    // Log para depuración
                    console.log(
                      `Usuario ${userEmail}: ${isOnline ? "online" : "offline"}`
                    );

                    return (
                      <div
                        key={userEmail}
                        className={`flex items-center p-3 rounded-lg border ${
                          isCurrentUser
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        } hover:shadow-md transition-all`}
                      >
                        <div className="relative">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              username
                            )}&background=random&color=fff&size=48`}
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
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {username}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                Tú
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {userEmail}
                            {isOnline && (
                              <span className="ml-1.5 text-xs font-normal text-green-600">
                                • en línea
                              </span>
                            )}
                          </div>
                        </div>
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

              {/* Estadísticas de colaboración - solo visible si hay al menos 3 usuarios */}
              {project.users && project.users.length >= 3 && (
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
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Total: {project.users.length} usuarios
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
                    {project.users.slice(0, 5).map((user, index) => (
                      <img
                        key={getUserEmail(user)}
                        className={`inline-block h-8 w-8 rounded-full ring-2 ring-white`}
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          getUserDisplayName(user)
                        )}&background=random&color=fff&size=32`}
                        alt={getUserDisplayName(user)}
                      />
                    ))}
                    {project.users.length > 5 && (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 ring-2 ring-white text-xs font-medium text-gray-800">
                        +{project.users.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
  )
}
