"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireSuperAdminViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeInternalPath, slugify, withQuery } from "@/lib/urls";

function getReturnTo(formData: FormData, fallback: string) {
  return normalizeInternalPath(String(formData.get("return_to") ?? ""), fallback);
}

function redirectWithCode(pathname: string, kind: "notice" | "error", code: string) {
  redirect(withQuery(pathname, { [kind]: code }));
}

export async function changeUserRoleAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/admins");
  await requireSuperAdminViewer(returnTo);

  const targetProfileId = String(formData.get("target_profile_id") ?? "");
  const targetRole = String(formData.get("target_role") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!targetProfileId || !["student", "admin"].includes(targetRole)) {
    redirectWithCode(returnTo, "error", "role-update-invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_platform_role", {
    target_profile_id: targetProfileId,
    target_role: targetRole,
    reason: reason || null,
  });

  if (error) {
    redirectWithCode(returnTo, "error", "role-update-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/admins");
  revalidatePath("/admin/students");
  redirectWithCode(returnTo, "notice", "role-updated");
}

export async function createCourseAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/courses");
  await requireAdminViewer(returnTo);

  const title = String(formData.get("title") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const shortDescription = String(formData.get("short_description") ?? "").trim();
  const fullDescription = String(formData.get("full_description") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "all_levels");

  if (!title) {
    redirectWithCode(returnTo, "error", "course-title-required");
  }

  const slug = requestedSlug || slugify(title);
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_course_from_admin", {
    course_title: title,
    requested_slug: slug,
    requested_short_description: shortDescription,
    requested_full_description: fullDescription,
    requested_difficulty: difficulty,
  });

  if (error) {
    redirectWithCode(returnTo, "error", "course-create-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  redirectWithCode("/admin/courses", "notice", "course-created");
}

export async function upsertStudentCourseAccessAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/students");
  await requireAdminViewer(returnTo);

  const targetStudentProfileId = String(formData.get("target_student_profile_id") ?? "");
  const targetCourseId = String(formData.get("target_course_id") ?? "");
  const targetCohortId = String(formData.get("target_cohort_id") ?? "").trim() || null;
  const enableAccess = String(formData.get("enable_access") ?? "true") === "true";

  if (!targetStudentProfileId || !targetCourseId) {
    redirectWithCode(returnTo, "error", "course-access-invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_student_course_access", {
    target_student_profile_id: targetStudentProfileId,
    target_course_id: targetCourseId,
    target_cohort_id: targetCohortId,
    enable_access: enableAccess,
  });

  if (error) {
    redirectWithCode(returnTo, "error", "course-access-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  redirectWithCode(returnTo, "notice", enableAccess ? "course-access-granted" : "course-access-revoked");
}
