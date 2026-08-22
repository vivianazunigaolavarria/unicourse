import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SessionRail } from "@/components/layout/session-rail";
import { getAdminNavigation } from "@/content/copy/es-mx";
import { requireAdminViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireAdminViewer("/admin");
  const navItems = getAdminNavigation(viewer.role === "super_admin" ? "super_admin" : "admin");

  return (
    <AppShell
      badge={viewer.role === "super_admin" ? "Super admin" : "Administración"}
      title="Panel de control"
      description="Visibilidad clara sobre alumnas, cursos, accesos y entregas, con permisos protegidos desde el servidor."
      navItems={navItems}
      rightRail={
        <SessionRail
          viewer={viewer}
          variant="admin"
          highlight={{
            label: "Permisos activos",
            value:
              viewer.role === "super_admin"
                ? "Puedes gestionar admins, cursos, accesos y revisar todo el historial."
                : "Puedes revisar alumnas, cursos y entregas desde este panel.",
          }}
        />
      }
    >
      {children}
    </AppShell>
  );
}
