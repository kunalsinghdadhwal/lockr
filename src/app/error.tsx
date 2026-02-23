"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="w-full max-w-sm mx-auto px-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-400/[0.06] border border-red-400/[0.08] mb-5">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          {error.message}
        </p>
        <Button
          onClick={reset}
          className="mt-6 bg-zinc-100 text-zinc-900 hover:bg-white font-medium"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
