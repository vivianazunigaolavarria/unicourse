import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "UniCourse",
  description: "Plataforma educativa para aprender inteligencia artificial y herramientas tecnológicas con claridad, calma y aplicaciones reales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
