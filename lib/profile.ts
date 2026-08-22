export type UserRole = "student" | "admin" | "super_admin" | "instructor";
export type AccountStatus = "invited" | "active" | "suspended" | "archived";
export type AgeRange =
  | "under_30"
  | "30_39"
  | "40_49"
  | "50_59"
  | "60_69"
  | "70_plus"
  | "prefer_not_to_say";

export type ViewerProfile = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
  role: UserRole;
  country: string | null;
  phone: string | null;
  age_range: AgeRange | null;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
};

export function isAdminRole(role: UserRole | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function getDashboardPathForRole(role: UserRole | null | undefined) {
  return isAdminRole(role) ? "/admin" : "/mis-cursos";
}

export function getDisplayName(profile: Pick<ViewerProfile, "display_name" | "first_name" | "last_name">) {
  const byName = `${profile.first_name} ${profile.last_name}`.trim();
  return profile.display_name?.trim() || byName;
}
