"use client"
import { SignUp } from "@/components/Signup"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Particles } from "@/components/ui/particles"

export function signIn() {
    const theme = localStorage.getItem("theme")
    const [color, setColor] = useState("#ffffff")
    
    useEffect(() => {
        setColor(theme === "dark" ? "#ffffff" : "#000000")
    }, [theme])
    
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <SignUp />
          </div>
        </div>
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={80}
          color={"#000000"}
          refresh
        />
    </div>
  )
}

export default signIn;