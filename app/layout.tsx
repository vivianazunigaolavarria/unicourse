import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "UniCourse",
  description: "Plataforma multicurso para alumnas, profesoras y administración.",
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
