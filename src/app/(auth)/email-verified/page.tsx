"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuccessConfetti } from "@/components/success-confetti";

export default function EmailVerifiedPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/80 dark:from-background dark:to-background/90">
      {showConfetti && <SuccessConfetti />}

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto z-10"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3,
              }}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 blur-md opacity-70 animate-pulse" />
                <div className="relative rounded-full bg-gradient-to-r from-green-400 to-emerald-500 p-4 shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="absolute -inset-3 rounded-full border-2 border-dashed border-green-200 dark:border-green-900"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-14 backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="pt-16 pb-8 px-6 md:px-8">
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                      Email Verified!
                    </h1>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <p className="text-muted-foreground">
                      Your account has been successfully activated. You're all
                      set to go!
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-8 space-y-4"
                >
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span>Your journey with us begins now</span>
                    <Sparkles className="h-4 w-4 text-green-500" />
                  </div>

                  <div className="relative h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent my-6" />

                  <div className="grid gap-4">
                    <Button
                      asChild
                      className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                    >
                      <Link
                        href="/sign-in"
                        className="flex items-center justify-center"
                      >
                        Continue to Login
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        <span className="absolute right-full w-12 h-full bg-white/20 skew-x-12 group-hover:animate-shine" />
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Link
                        href="/"
                        className="flex items-center justify-center"
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Return to Homepage
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              </div>

              <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
