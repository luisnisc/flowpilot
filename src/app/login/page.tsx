import React from 'react'
import Login from "../components/Login"
import Image from "next/image";

export default function LoginPage() {
  return (
    <>
    <div className='bg-black rounded-br-3xl w-35 md:w-80 h-15 absolute top-0 left-0 flex items-center justify-center'>
    <a href="/">
    <Image
      src="/logoFlowPilot.png"
      alt="Logo"
      width={200}
      height={80}
    />
    </a>
    </div>
    <a href="/register"><button className='btn btn-primary absolute right-0 m-4'>Registrate</button></a>
    <Login/>
    </>
  )
}
