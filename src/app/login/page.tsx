import React from 'react'
import Login from "../components/Login"

export default function LoginPage() {
  return (
    <>
    <a href="/register"><button className='btn btn-primary absolute right-0 m-4'>Registrate</button></a>
    <Login/>
    </>
  )
}
