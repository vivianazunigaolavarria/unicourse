"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireSuperAdminViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeInternalPath, slugify, withQuery } from "@/lib/urls";

function getReturnTo(formData: FormData, fallback: string) {
  return normalizeInternalPath(String(formData.get("return_to") ?? ""), fallback);
}

function toPathnameOnly(value: string) {
  return value.split("#")[0]?.split("?")[0] || value;
}

function redirectWithCode(pathname: string, kind: "notice" | "error", code: string): never {
  redirect(withQuery(pathname, { [kind]: code }));
}

function revalidateAdminPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(toPathnameOnly(path));
  }
}

export async function changeUserRoleAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/administradores");
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

  revalidateAdminPaths([
    "/admin",
    "/admin/administradores",
    "/admin/admins",
    "/admin/alumnas",
    "/admin/students",
  ]);
  redirectWithCode(returnTo, "notice", "role-updated");
}

export async function createCourseAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/cursos");
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

  revalidateAdminPaths(["/admin", "/admin/cursos", "/admin/courses"]);
  redirectWithCode("/admin/cursos", "notice", "course-created");
}

export async function upsertStudentCourseAccessAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/alumnas");
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

  revalidateAdminPaths([
    "/admin",
    "/admin/alumnas",
    "/admin/students",
    returnTo,
  ]);
  redirectWithCode(returnTo, "notice", enableAccess ? "course-access-granted" : "course-access-revoked");
}

export async function createTagAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/alumnas");
  const viewer = await requireAdminViewer(returnTo);
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || null;
  const assignToProfileId = String(formData.get("assign_to_profile_id") ?? "").trim() || null;

  if (!name) {
    redirectWithCode(returnTo, "error", "tag-create-invalid");
  }

  if (color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
    redirectWithCode(returnTo, "error", "tag-create-invalid");
  }

  const supabase = await createClient();
  const { data: tag, error } = await supabase
    .from("tags")
    .insert({
      name,
      category,
      color,
      source: "manual",
    })
    .select("id, name")
    .single();

  if (error || !tag) {
    redirectWithCode(returnTo, "error", "tag-create-failed");
  }

  await supabase.from("admin_audit_logs").insert({
    actor_user_id: viewer.id,
    target_user_id: assignToProfileId,
    action: "tag_created",
    metadata: {
      tag_id: tag.id,
      name: tag.name,
      category,
      color,
    },
  });

  if (assignToProfileId) {
    await supabase
      .from("user_tags")
      .upsert(
        {
          profile_id: assignToProfileId,
          tag_id: tag.id,
          assigned_by_profile_id: viewer.id,
        },
        { onConflict: "profile_id,tag_id", ignoreDuplicates: true },
      );

    await supabase.from("admin_audit_logs").insert({
      actor_user_id: viewer.id,
      target_user_id: assignToProfileId,
      action: "tag_assigned",
      metadata: {
        tag_id: tag.id,
        name: tag.name,
      },
    });
  }

  revalidateAdminPaths([
    "/admin/alumnas",
    "/admin/students",
    returnTo,
  ]);
  redirectWithCode(returnTo, "notice", assignToProfileId ? "tag-created-and-assigned" : "tag-created");
}

export async function renameTagAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/alumnas");
  const viewer = await requireAdminViewer(returnTo);
  const tagId = String(formData.get("tag_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!tagId || !name) {
    redirectWithCode(returnTo, "error", "tag-update-invalid");
  }

  const supabase = await createClient();
  const { data: existingTag } = await supabase
    .from("tags")
    .select("id, name, source")
    .eq("id", tagId)
    .maybeSingle();

  if (!existingTag || existingTag.source !== "manual") {
    redirectWithCode(returnTo, "error", "tag-update-invalid");
  }

  const { error } = await supabase
    .from("tags")
    .update({ name })
    .eq("id", tagId);

  if (error) {
    redirectWithCode(returnTo, "error", "tag-update-failed");
  }

  await supabase.from("admin_audit_logs").insert({
    actor_user_id: viewer.id,
    action: "tag_updated",
    metadata: {
      tag_id: tagId,
      previous_name: existingTag.name,
      next_name: name,
    },
  });

  revalidateAdminPaths([
    "/admin/alumnas",
    "/admin/students",
    returnTo,
  ]);
  redirectWithCode(returnTo, "notice", "tag-updated");
}

export async function assignTagAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/alumnas");
  const viewer = await requireAdminViewer(returnTo);
  const targetProfileId = String(formData.get("target_profile_id") ?? "").trim();
  const tagId = String(formData.get("tag_id") ?? "").trim();

  if (!targetProfileId || !tagId) {
    redirectWithCode(returnTo, "error", "tag-assign-invalid");
  }

  const supabase = await createClient();
  const { data: tag } = await supabase
    .from("tags")
    .select("id, name, source")
    .eq("id", tagId)
    .maybeSingle();

  if (!tag || tag.source !== "manual") {
    redirectWithCode(returnTo, "error", "tag-assign-invalid");
  }

  const { error } = await supabase
    .from("user_tags")
    .upsert(
      {
        profile_id: targetProfileId,
        tag_id: tagId,
        assigned_by_profile_id: viewer.id,
      },
      { onConflict: "profile_id,tag_id", ignoreDuplicates: true },
    );

  if (error) {
    redirectWithCode(returnTo, "error", "tag-assign-failed");
  }

  await supabase.from("admin_audit_logs").insert({
    actor_user_id: viewer.id,
    target_user_id: targetProfileId,
    action: "tag_assigned",
    metadata: {
      tag_id: tagId,
      name: tag.name,
    },
  });

  revalidateAdminPaths([
    "/admin/alumnas",
    "/admin/students",
    returnTo,
  ]);
  redirectWithCode(returnTo, "notice", "tag-assigned");
}

export async function removeTagAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/alumnas");
  const viewer = await requireAdminViewer(returnTo);
  const targetProfileId = String(formData.get("target_profile_id") ?? "").trim();
  const tagId = String(formData.get("tag_id") ?? "").trim();

  if (!targetProfileId || !tagId) {
    redirectWithCode(returnTo, "error", "tag-remove-invalid");
  }

  const supabase = await createClient();
  const { data: tag } = await supabase
    .from("tags")
    .select("id, name, source")
    .eq("id", tagId)
    .maybeSingle();

  if (!tag || tag.source !== "manual") {
    redirectWithCode(returnTo, "error", "tag-remove-invalid");
  }

  const { error } = await supabase
    .from("user_tags")
    .delete()
    .eq("profile_id", targetProfileId)
    .eq("tag_id", tagId);

  if (error) {
    redirectWithCode(returnTo, "error", "tag-remove-failed");
  }

  await supabase.from("admin_audit_logs").insert({
    actor_user_id: viewer.id,
    target_user_id: targetProfileId,
    action: "tag_removed",
    metadata: {
      tag_id: tagId,
      name: tag.name,
    },
  });

  revalidateAdminPaths([
    "/admin/alumnas",
    "/admin/students",
    returnTo,
  ]);
  redirectWithCode(returnTo, "notice", "tag-removed");
}
