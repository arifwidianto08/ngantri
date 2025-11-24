import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
