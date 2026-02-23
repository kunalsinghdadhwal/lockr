import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import ThemeProvider from "@/utils/ThemeProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";


export const metadata: Metadata = {
  title: {
    default: "Lockr",
    template: "%s | Lockr",
  },
  description: "End-to-end encrypted password manager. Your credentials never leave your browser unencrypted.",
};
const inter = Inter({ subsets: ["latin"] });
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-white dark:bg-black ${inter.className}`}>
        <ThemeProvider  >
          <NuqsAdapter>
            <main>{children}</main>
          </NuqsAdapter>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
