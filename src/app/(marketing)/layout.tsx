import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black text-black dark:text-white">
      <header className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Lock className="h-6 w-6" />
          <span>Lockr</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            href="/#features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Features
          </Link>
          <Link
            href="/#security"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Security
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
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

      <main className="flex-1">{children}</main>

      <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-black py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row md:py-0">
          <div className="flex items-center gap-2 font-bold text-black dark:text-white">
            <Lock className="h-5 w-5" />
            <span>Lockr</span>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 md:text-left">
            &copy; {new Date().getFullYear()} Lockr. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4 sm:gap-6">
              <Link
                href="#"
                className="text-xs text-gray-600 dark:text-gray-400 hover:underline underline-offset-4"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-xs text-gray-600 dark:text-gray-400 hover:underline underline-offset-4"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-xs text-gray-600 dark:text-gray-400 hover:underline underline-offset-4"
              >
                Contact
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
