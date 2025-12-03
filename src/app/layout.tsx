import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { GlobalAuthInterceptor } from "@/components/GlobalAuthInterceptor";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SalesDost - Welcome",
  description: "Sales incentive management platform",
};

import { AuthGate } from "@/components/AuthGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
      >
        {/* Global client-side 401 handler: if any fetch returns 401, trigger logout */}
        <GlobalAuthInterceptor />
        <AuthGate>
          {children}
        </AuthGate>
      </body>
    </html>
  );
}
