import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIMS - Fuel Inventory Management System",
  description: "Fuel Inventory Management System for Tuzla International Airport",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
