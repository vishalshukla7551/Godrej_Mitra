import type { Metadata } from "next";
import "./globals.css";
import { GlobalAuthInterceptor } from "@/components/GlobalAuthInterceptor";

// Google fonts removed for build-time reliability; using system fonts via CSS

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
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        {/* Global client-side 401 handler: if any fetch returns 401, trigger logout */}
        <GlobalAuthInterceptor />
        <AuthGate>
          {children}
        </AuthGate>
      </body>
    </html>
  );
}
