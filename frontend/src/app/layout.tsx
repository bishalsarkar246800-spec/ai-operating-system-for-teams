import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Operating System for Teams | Intelligent Dependency Engine",
  description:
    "Multi-tenant workspace platform transforming unstructured briefs and team activity into dependency graphs, surfacing downstream risk, and executing human-approved agent actions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
