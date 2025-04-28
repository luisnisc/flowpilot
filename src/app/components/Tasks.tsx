"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import SideBar from "./SideBar"

export default function DashBoard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <div>Cargando...</div>
  }

  return (
    <div className="relative">
      <div className="absolute right-0 m-4">
        <button
          onClick={() =>
            signOut({ callbackUrl: "http://localhost:3000/login" })
          }
          className="btn btn-primary"
        >
          Logout
        </button>
      </div>
      <SideBar/>
      <div className="flex flex-col h-screen bg-gray-200 text-black *:w-5/6 ml-[19.66667%]">
        <h1 className="text-3xl font-bold mb-4">Tasks</h1>
      </div>
    </div>
  )
}