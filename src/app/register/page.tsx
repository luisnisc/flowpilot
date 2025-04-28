import React from 'react'
import Register from "../components/Register"

export default function RegisterPage() {
  return (
    <>
    <a href="/login"><button className="btn btn-primary absolute right-0 m-4">Iniciar Sesión</button></a>
    <Register/>
    </>
  )
}
