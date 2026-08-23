"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireSuperAdminViewer } from "@/lib/auth";
import { getGoogleCalendarConfig } from "@/lib/env";
import { createGoogleMeetEvent, deleteGoogleCalendarEvent, getGoogleCalendarIntegrationState } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";
import { normalizeInternalPath, slugify, withQuery } from "@/lib/urls";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const DEFAULT_LIVE_CLASS_TIME_ZONE = "America/Mexico_City";

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

function getTimeZoneOffsetMilliseconds(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(value);
  const readPart = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    readPart("year"),
    readPart("month") - 1,
    readPart("day"),
    readPart("hour"),
    readPart("minute"),
    readPart("second"),
  );

  return asUtc - value.getTime();
}

function parseLiveClassStart(dateValue: string, timeValue: string, timeZone: string) {
  const [year, month, day] = dateValue.split("-").map((value) => Number(value));
  const [hour, minute] = timeValue.split(":").map((value) => Number(value));

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return null;
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const firstOffset = getTimeZoneOffsetMilliseconds(utcGuess, timeZone);
  const firstPass = new Date(utcGuess.getTime() - firstOffset);
  const refinedOffset = getTimeZoneOffsetMilliseconds(firstPass, timeZone);
  const finalDate = new Date(utcGuess.getTime() - refinedOffset);

  return Number.isNaN(finalDate.getTime()) ? null : finalDate;
}

function buildLiveClassTitle(courseTitle: string, cohortName?: string | null) {
  return cohortName ? `${courseTitle} · ${cohortName}` : courseTitle;
}

function buildLiveClassDescription(courseTitle: string, description: string, cohortName?: string | null) {
  return [
    description || `Clase en vivo de ${courseTitle}.`,
    cohortName ? `Cohorte: ${cohortName}` : null,
    "Programada desde UniCourse para compartirse por Google Meet.",
  ]
    .filter(Boolean)
    .join("\n\n");
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

export async function createLiveClassAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/admin/sesiones-en-vivo");
  const viewer = await requireAdminViewer(returnTo);
  const courseId = String(formData.get("course_id") ?? "").trim();
  const cohortId = String(formData.get("cohort_id") ?? "").trim() || null;
  const startsOn = String(formData.get("starts_on") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationMinutes = Number(formData.get("duration_minutes") ?? 0);

  if (!courseId || !startsOn || !startsAt || !Number.isFinite(durationMinutes) || durationMinutes < 30 || durationMinutes > 240) {
    redirectWithCode(returnTo, "error", "live-class-invalid");
  }

  const googleState = getGoogleCalendarIntegrationState();

  if (!googleState.configured) {
    redirectWithCode(returnTo, "error", "live-class-google-not-configured");
  }

  const timeZone = getGoogleCalendarConfig()?.timeZone ?? DEFAULT_LIVE_CLASS_TIME_ZONE;
  const startsAtDate = parseLiveClassStart(startsOn, startsAt, timeZone);

  if (!startsAtDate || startsAtDate.getTime() <= Date.now()) {
    redirectWithCode(returnTo, "error", "live-class-invalid");
  }

  const endsAtDate = new Date(startsAtDate.getTime() + durationMinutes * 60_000);
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, status")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.status === "archived") {
    redirectWithCode(returnTo, "error", "live-class-invalid");
  }

  const cohort = cohortId
    ? await supabase
        .from("cohorts")
        .select("id, course_id, name")
        .eq("id", cohortId)
        .maybeSingle()
    : { data: null };

  if (cohortId && (!cohort.data || cohort.data.course_id !== courseId)) {
    redirectWithCode(returnTo, "error", "live-class-invalid");
  }

  let enrollmentQuery = supabase
    .from("enrollments")
    .select("student_profile_id")
    .eq("course_id", courseId)
    .eq("status", "active")
    .eq("access_state", "enabled");

  if (cohortId) {
    enrollmentQuery = enrollmentQuery.eq("cohort_id", cohortId);
  }

  const { data: enrollmentRows, error: enrollmentError } = await enrollmentQuery;

  if (enrollmentError) {
    redirectWithCode(returnTo, "error", "live-class-create-failed");
  }

  const profileIds = Array.from(new Set((enrollmentRows ?? []).map((row) => row.student_profile_id))).filter(Boolean);
  const { data: attendeeProfiles, error: attendeeProfilesError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, account_status")
    .in("id", profileIds.length ? profileIds : [EMPTY_UUID]);

  if (attendeeProfilesError) {
    redirectWithCode(returnTo, "error", "live-class-create-failed");
  }

  const attendeeEmails = Array.from(
    new Set(
      (attendeeProfiles ?? [])
        .filter((profile) => profile.role === "student")
        .filter((profile) => profile.account_status !== "archived" && profile.account_status !== "suspended")
        .map((profile) => profile.email?.trim())
        .filter((email): email is string => Boolean(email) && !email.endsWith("@placeholder.local")),
    ),
  );

  const cohortName = cohort.data?.name ?? null;
  const title = buildLiveClassTitle(course.title, cohortName);
  const googleDescription = buildLiveClassDescription(course.title, description, cohortName);

  let googleEvent: Awaited<ReturnType<typeof createGoogleMeetEvent>> | null = null;

  try {
    googleEvent = await createGoogleMeetEvent({
      title,
      description: googleDescription,
      startsAtIso: startsAtDate.toISOString(),
      endsAtIso: endsAtDate.toISOString(),
      attendeeEmails,
    });
  } catch (error) {
    console.error("Failed to create live class event", error);
    redirectWithCode(returnTo, "error", "live-class-create-failed");
  }

  const { data: createdLiveClass, error: insertError } = await supabase
    .from("live_classes")
    .insert({
      course_id: courseId,
      cohort_id: cohortId,
      instructor_profile_id: viewer.id,
      created_by_profile_id: viewer.id,
      title,
      description,
      starts_at: startsAtDate.toISOString(),
      duration_minutes: durationMinutes,
      meeting_url: googleEvent.meetingUrl,
      google_calendar_event_id: googleEvent.eventId,
      google_calendar_html_link: googleEvent.calendarHtmlLink,
      student_invite_count: googleEvent.attendeeCount,
      calendar_last_synced_at: new Date().toISOString(),
      status: "published",
    })
    .select("id")
    .single();

  if (insertError || !createdLiveClass) {
    if (googleEvent?.eventId) {
      await deleteGoogleCalendarEvent(googleEvent.eventId).catch((cleanupError) => {
        console.error("Failed to cleanup orphan Google event", cleanupError);
      });
    }

    redirectWithCode(returnTo, "error", "live-class-create-failed");
  }

  await supabase.from("admin_audit_logs").insert({
    actor_user_id: viewer.id,
    action: "live_class_created",
    metadata: {
      live_class_id: createdLiveClass.id,
      course_id: courseId,
      cohort_id: cohortId,
      google_calendar_event_id: googleEvent.eventId,
      invited_students: googleEvent.attendeeCount,
      starts_at: startsAtDate.toISOString(),
      duration_minutes: durationMinutes,
    },
  });

  revalidateAdminPaths([
    "/admin",
    "/admin/sesiones-en-vivo",
    "/admin/students",
    "/admin/alumnas",
    "/dashboard",
    "/mis-clases",
  ]);
  redirectWithCode(returnTo, "notice", "live-class-created");
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
