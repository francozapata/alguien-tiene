import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import FooterLegal from "@/components/FooterLegal";
import FloatingChatButton from "@/components/figus/FloatingChatButton";

export const metadata: Metadata = {
  title: "Alguien Tiene · Figus Mundial 2026",
  description: "Lo que buscás, alguien lo tiene. Intercambios de figuritas del Mundial 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <FloatingChatButton />
          <FooterLegal />
        </AuthProvider>
      </body>
    </html>
  );
}
