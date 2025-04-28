import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function SideBar() {
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

      <nav className="w-full">
        <ul className="flex flex-col space-y-4">
          <li>
            <Link href="/projects" className="block w-full text-center py-2 hover:bg-gray-700 rounded">
                Proyectos
            </Link>
          </li>
          <li>
            <Link href="/teams" className="block w-full text-center py-2 hover:bg-gray-700 rounded">
                Equipos
            </Link>
          </li>
          <li>
            <Link href="/tasks" className="block w-full text-center py-2 hover:bg-gray-700 rounded">
                Tareas
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}