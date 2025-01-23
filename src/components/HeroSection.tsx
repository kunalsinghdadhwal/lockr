import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-indigo-900 sm:text-5xl md:text-6xl">
            <span className="block xl:inline">Welcome to Our</span>{" "}
            <span className="block xl:inline">Amazing Platform</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover the power of our platform. We provide innovative solutions to help you achieve your goals and
            transform your ideas into reality.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Button size="lg" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                Get started
              </Button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

