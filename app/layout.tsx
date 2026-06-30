import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
            success: {
              style: {
                background: '#22c55e',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
