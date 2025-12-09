import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/toast-provider";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "ngantri",
  description: "Your go to Food Court Ordering System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
