import { Navbar } from "@/components/Navbar"
import { AuroraBackground } from "@/components/ui/aurora-background"

export default function Home() {
  return (
    <AuroraBackground >
      <Navbar />
      <main className="flex-grow flex items-center justify-center">
      </main>
    </AuroraBackground>
  )
}

