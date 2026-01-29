import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Local-only finance dashboard web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
