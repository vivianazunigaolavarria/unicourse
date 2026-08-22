import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { getDashboardPathForRole, type ViewerProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { withQuery } from "@/lib/urls";
export { getDisplayName, type AccountStatus, type AgeRange, type UserRole, type ViewerProfile } from "@/lib/profile";

type AuthenticatedUserSeed = {
  id: string;
  email: string | null | undefined;
  user_metadata?: Record<string, unknown> | null;
};

function readMetadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildViewerFallback(user: AuthenticatedUserSeed): ViewerProfile {
  const metadata = user.user_metadata ?? {};
  const email = readMetadataText(user.email) ?? `user-${user.id}@placeholder.local`;
  const firstName = readMetadataText(metadata.first_name) ?? email.split("@")[0] ?? "Nueva";
  const lastName = readMetadataText(metadata.last_name) ?? "Usuaria";
  const displayName = readMetadataText(metadata.display_name);
  const country = readMetadataText(metadata.country);
  const phone = readMetadataText(metadata.phone);
  const now = new Date().toISOString();

  return {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    email,
    role: "student",
    country,
    phone,
    age_range: null,
    date_of_birth: null,
    occupation: null,
    account_status: "invited",
    created_at: now,
    updated_at: now,
  };
}

async function readViewerProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, email, role, country, phone, age_range, date_of_birth, occupation, account_status, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  return (profile as ViewerProfile | null) ?? null;
}

async function restoreViewerProfile(user: AuthenticatedUserSeed) {
  const supabase = await createClient();
  const fallback = buildViewerFallback(user);
  const { error } = await supabase.from("profiles").insert({
    id: fallback.id,
    first_name: fallback.first_name,
    last_name: fallback.last_name,
    display_name: fallback.display_name,
    email: fallback.email,
    phone: fallback.phone,
    country: fallback.country,
  });

  if (error) {
    return fallback;
  }

  return (await readViewerProfile(user.id)) ?? fallback;
}

export async function getOptionalViewer() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await readViewerProfile(user.id);

  if (profile) {
    return profile;
  }

  return await restoreViewerProfile({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  });
}

export async function requireAuthenticatedViewer(nextPath = "/dashboard") {
  const viewer = await getOptionalViewer();

  if (!viewer) {
    redirect(withQuery("/login", { next: nextPath }));
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
