import React from 'react'

export default function Home() {
  return (
    <main className="text-black flex min-h-screen flex-col items-center justify-between md:p-96 pt-60 pb-96 m-10">
      <h1 className="text-4xl font-bold">Bienvenido a FlowPilot</h1>
      <p className="mt-4 text-lg">La nueva solución para la gestión de proyectos en tiempo real</p>
      <a href="/login"><button className='btn btn-rpimary'>Empezar</button></a>
    </main>
  )
}
