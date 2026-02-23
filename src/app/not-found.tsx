import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="w-full max-w-sm mx-auto px-6 text-center">
        <p className="text-6xl font-bold text-zinc-800">404</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mt-4">
          Page not found
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center mt-6 h-9 px-4 rounded-md bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-medium transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
