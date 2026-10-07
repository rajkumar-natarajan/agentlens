import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentLens — See everything your AI agents do",
  description:
    "Observability, evaluation, and governance for production AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
