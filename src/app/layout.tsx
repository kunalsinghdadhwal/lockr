import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import ThemeProvider from "@/utils/ThemeProvider";
import { ChatBot } from "@/components/chat-bot";


export const metadata: Metadata = {
  title: "Sigma Boyz",
  description: "Sigma Boyz web programming project",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main>{children}</main>
        </ThemeProvider>
        <ChatBot />
        <Toaster />
      </body>
    </html>
  );
}
