import React from "react";
import { Suspense } from "react";
import AddTaskForm from "../components/AddTaskForm";

export default function addAskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700 font-medium">
            Cargando...
          </p>
        </div>
      }
    >
      <AddTaskForm />
    </Suspense>
  );
}
