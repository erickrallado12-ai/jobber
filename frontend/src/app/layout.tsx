import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import { ClientLayout } from "@/components/client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobber — Find Your Next Role",
  description: "Search and apply to jobs with AI-powered resume matching",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
