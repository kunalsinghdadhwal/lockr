import { Navbar } from "@/components/Navbar"
import { HeroSection } from "@/components/HeroSection"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        {/* Add more sections or content here */}
      </main>
    </div>
  )
}

