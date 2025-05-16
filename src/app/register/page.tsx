import React from 'react'
import Register from "../components/Register"
import Image from "next/image";

export default function RegisterPage() {
  return (
    <>
    <div className='bg-black rounded-br-3xl w-80 h-20 absolute top-0 left-0 flex items-center justify-center'>
      <a href="/">
        <Image
          src="/logoFlowPilot.png"
          alt="Logo"
          width={200}
          height={80}
        />
      </a>
        </div>
    <a href="/login"><button className="btn btn-primary absolute right-0 m-4">Iniciar Sesión</button></a>
    <Register/>
    </>
  )
}
