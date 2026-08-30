import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/api/trpc-client";

export const metadata: Metadata = {
  title: "Libres Personal Trainer",
  description: "AI-powered personal trainer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
