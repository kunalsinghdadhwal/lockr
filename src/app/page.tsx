
import Link from "next/link"
import { ArrowRight, Check, Lock, Shield, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black text-black dark:text-white">
      <header className="container flex h-16 items-center justify-between px-4 md:px-6 bg-white dark:bg-black text-black dark:text-white">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Lock className="h-6 w-6" />
          <span>SecureVault</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
            Features
          </Link>
          <Link href="#security" className="text-sm font-medium hover:underline underline-offset-4">
            Security
          </Link>
          <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button
              variant="outline"
              className="border-gray-200 dark:border-white/20 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Login
            </Button>
          </Link>
          <Link href="/sign-up" className="hidden md:block">
            <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
              Get Started
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Secure Your Digital Life with One Master Password
                  </h1>
                  <p className="max-w-[600px] text-gray-400 md:text-xl">
                    Store, generate, and auto-fill passwords across all your devices with military-grade encryption.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/sign-up">
                    <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button
                      variant="outline"
                      className="border-gray-200 dark:border-white/20 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border border-white/10 bg-black p-2 shadow-2xl">
                  <div className="animate-pulse-slow absolute -left-20 -top-20 h-40 w-40 rounded-full bg-white/5"></div>
                  <div className="animate-pulse-slow absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-white/10"></div>
                  <div className="relative z-10 rounded-lg bg-zinc-900 p-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-white" />
                        <span className="font-medium">Password Vault</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-white/20"></div>
                        <div className="h-2 w-2 rounded-full bg-white/20"></div>
                        <div className="h-2 w-2 rounded-full bg-white/20"></div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-24 rounded bg-white/10"></div>
                          <div className="h-4 w-32 rounded bg-white/10"></div>
                        </div>
                        <div className="h-3 w-full rounded bg-white/5"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-28 rounded bg-white/10"></div>
                          <div className="h-4 w-36 rounded bg-white/10"></div>
                        </div>
                        <div className="h-3 w-full rounded bg-white/5"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-20 rounded bg-white/10"></div>
                          <div className="h-4 w-40 rounded bg-white/10"></div>
                        </div>
                        <div className="h-3 w-full rounded bg-white/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-950 py-12 md:py-24 lg:py-32"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-white/10 px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need</h2>
                <p className="max-w-[900px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  SecureVault offers a comprehensive suite of tools to manage your digital identity.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-black p-6 transition-all hover:shadow-xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <Shield className="h-12 w-12 mb-4 text-white" />
                  <h3 className="text-xl font-bold">Password Generator</h3>
                  <p className="mt-2 text-gray-400">Create strong, unique passwords with our advanced generator.</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-black p-6 transition-all hover:shadow-xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <Zap className="h-12 w-12 mb-4 text-white" />
                  <h3 className="text-xl font-bold">Auto-Fill</h3>
                  <p className="mt-2 text-gray-400">Save time with automatic form filling across all your devices.</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-black p-6 transition-all hover:shadow-xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <Lock className="h-12 w-12 mb-4 text-white" />
                  <h3 className="text-xl font-bold">Secure Storage</h3>
                  <p className="mt-2 text-gray-400">End-to-end encryption ensures your data stays private.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="security"
          className="w-full border-t border-black/10 dark:border-white/10 bg-white dark:bg-black py-12 md:py-24 lg:py-32"
        >
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Military-Grade Security</h2>
              <p className="max-w-[600px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Your data is protected with AES-256 encryption, the same standard used by governments and military
                organizations worldwide.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-white" />
                  <span>End-to-end encryption</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-white" />
                  <span>Zero-knowledge architecture</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-white" />
                  <span>Two-factor authentication</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-white" />
                  <span>Biometric authentication</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[300px] w-[300px] md:h-[400px] md:w-[400px]">
                <div className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-white/10"></div>
                <div className="animate-pulse absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Shield className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="cta"
          className="w-full border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-950 py-12 md:py-24 lg:py-32"
        >
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to secure your digital life?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users who trust SecureVault with their passwords.
              </p>
            </div>
            <div className="mx-auto flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/sign-up">
                <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="border-gray-200 dark:border-white/20 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 dark:border-white/10 border-black/10 bg-black dark:bg-black bg-white py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row md:py-0">
          <div className="flex items-center gap-2 font-bold text-black dark:text-white">
            <Lock className="h-5 w-5" />
            <span>SecureVault</span>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 md:text-left">
            &copy; {new Date().getFullYear()} SecureVault. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4 sm:gap-6">
              <Link href="#" className="text-xs text-gray-600 dark:text-gray-400 hover:underline underline-offset-4">
                Terms
              </Link>
              <Link href="#" className="text-xs text-gray-600 dark:text-gray-400 hover:underline underline-offset-4">
                Privacy
              </Link>
              <Link href="#" className="text-xs text-gray-600 dark:text-gray-400 hover:underline underline-offset-4">
                Contact
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  )
}

