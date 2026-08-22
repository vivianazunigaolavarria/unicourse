import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { getDashboardPathForRole, type ViewerProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { withQuery } from "@/lib/urls";
export { getDisplayName, type AccountStatus, type AgeRange, type UserRole, type ViewerProfile } from "@/lib/profile";

export async function getOptionalViewer() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (!userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, email, role, country, phone, age_range, account_status, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  return (profile as ViewerProfile | null) ?? null;
}

export async function requireAuthenticatedViewer(nextPath = "/mis-cursos") {
  const viewer = await getOptionalViewer();

  if (!viewer) {
    redirect(withQuery("/iniciar-sesion", { next: nextPath }));
  }

  return viewer;
}

export async function requireAdminViewer(nextPath = "/admin") {
  const viewer = await requireAuthenticatedViewer(nextPath);

  if (viewer.role !== "admin" && viewer.role !== "super_admin") {
    redirect("/acceso-denegado");
  }

  return viewer;
}

export async function requireSuperAdminViewer(nextPath = "/admin/admins") {
  const viewer = await requireAdminViewer(nextPath);

  if (viewer.role !== "super_admin") {
    redirect("/acceso-denegado");
  }

  return viewer;
}
