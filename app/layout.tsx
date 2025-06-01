import type React from "react";
import "@/app/globals.css";
import { Toaster } from "@/components/toaster";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
