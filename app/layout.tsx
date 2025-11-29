import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
