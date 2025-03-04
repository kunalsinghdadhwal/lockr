"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"

export function SuccessConfetti() {
  const { width, height } = useWindowSize()
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsActive(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!isActive) return null

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.15}
      colors={["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#ECFDF5"]}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  )
}

