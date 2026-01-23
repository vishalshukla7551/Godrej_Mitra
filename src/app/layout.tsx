import type { Metadata } from "next";
import "./globals.css";
import { GlobalAuthInterceptor } from "@/components/GlobalAuthInterceptor";
import { AuthProvider } from "@/contexts/AuthContext";

// Google fonts removed for build-time reliability; using system fonts via CSS

export const metadata: Metadata = {
  title: "Salesmitr",
  description: "Sales incentive management platform",
};

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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
