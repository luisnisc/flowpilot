import React from 'react'
import Login from "../components/Login"
import Image from "next/image";

export default function LoginPage() {
  return (
    <>
    <div className='bg-black rounded-br-3xl w-80 h-20 absolute top-0 left-0 flex items-center justify-center'>
    <Image
      src="/logoFlowPilot.png"
      alt="Logo"
      width={200}
      height={80}
    />
    </div>
    <a href="/register"><button className='btn btn-primary absolute right-0 m-4'>Registrate</button></a>
    <Login/>
    </>
  )
}
