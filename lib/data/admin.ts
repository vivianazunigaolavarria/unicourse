import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

type EnrollmentRecord = {
  id: string;
  student_profile_id: string;
  course_id: string;
  cohort_id: string | null;
  status: string;
  access_state: string;
  enrolled_at: string;
  completed_at: string | null;
  courses: { id: string; title: string } | null;
  cohorts: { id: string; name: string } | null;
};

type StudentProfileRecord = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
  country: string | null;
  phone: string | null;
  age_range: string | null;
  date_of_birth?: string | null;
  occupation?: string | null;
  created_at: string;
  account_status: string;
  role?: string;
};

type AdminDirectoryProfileRecord = StudentProfileRecord & {
  date_of_birth: string | null;
  occupation: string | null;
  role: string;
};

type CourseRecord = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  difficulty: string;
  estimated_duration_minutes: number | null;
  status: string;
  created_at: string;
};

type SubmissionRecord = {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  instructor_feedback: string | null;
  reviewer_profile_id: string | null;
  is_late: boolean;
  created_at: string;
};

type AssignmentRecord = {
  id: string;
  title: string;
  course_id: string;
  due_at: string | null;
  status: string;
};

type TagRecord = {
  id: string;
  name: string;
  color: string | null;
  category: string | null;
  source: "manual" | "automatic";
  system_key: string | null;
};

type UserTagRecord = {
  profile_id: string;
  created_at: string;
  tags: TagRecord | null;
};

type LiveClassRecord = {
  id: string;
  course_id: string;
  cohort_id: string | null;
  instructor_profile_id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  google_calendar_event_id?: string | null;
  google_calendar_html_link?: string | null;
  student_invite_count?: number;
  calendar_last_synced_at?: string | null;
  status: string;
};

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

const syncAuthUsersIntoProfiles = cache(async () => {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_auth_users_into_profiles");

  if (!error) {
    return;
  }

  const message = error.message.toLowerCase();
  const canSafelyIgnore =
    message.includes("could not find the function") ||
    message.includes("does not exist") ||
    message.includes("only admins can sync auth users into profiles");

  if (!canSafelyIgnore) {
    console.error("Failed to sync auth users into profiles", error);
  }
});

function takeFirst<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeStudentProfileRecord(row: Record<string, unknown>) {
  return row as unknown as StudentProfileRecord;
}

function normalizeAdminDirectoryProfileRecord(row: Record<string, unknown>) {
  return row as unknown as AdminDirectoryProfileRecord;
}

function normalizeEnrollmentRecord(row: Record<string, unknown>) {
  return {
    ...row,
    courses: takeFirst(row.courses as EnrollmentRecord["courses"] | EnrollmentRecord["courses"][]),
    cohorts: takeFirst(row.cohorts as EnrollmentRecord["cohorts"] | EnrollmentRecord["cohorts"][]),
  } as EnrollmentRecord;
}

function normalizeTagRecord(row: Record<string, unknown>) {
  return row as unknown as TagRecord;
}

function normalizeUserTagRecord(row: Record<string, unknown>) {
  const tag = takeFirst(row.tags as TagRecord | TagRecord[] | null | undefined);

  return {
    ...row,
    tags: tag ? normalizeTagRecord(tag as unknown as Record<string, unknown>) : null,
  } as UserTagRecord;
}

function getSearchPattern(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replaceAll(",", " ");
  return `%${normalized}%`;
}

function toUniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function intersectIds(current: string[] | null, next: string[]) {
  const uniqueNext = Array.from(new Set(next));

  if (current === null) {
    return uniqueNext;
  }

  const nextSet = new Set(uniqueNext);
  return current.filter((id) => nextSet.has(id));
}

function groupTagsByProfile(rows: UserTagRecord[]) {
  const grouped = new Map<string, Array<TagRecord & { assigned_at: string }>>();

  for (const row of rows) {
    const tag = row.tags;

    if (!tag) {
      continue;
    }

    const current = grouped.get(row.profile_id) ?? [];
    current.push({
      ...tag,
      assigned_at: row.created_at,
    });
    grouped.set(row.profile_id, current);
  }

  for (const [profileId, tags] of grouped.entries()) {
    tags.sort((left, right) => {
      if (left.source !== right.source) {
        return left.source === "automatic" ? -1 : 1;
      }

      return left.name.localeCompare(right.name, "es-MX");
    });
    grouped.set(profileId, tags);
  }

  return grouped;
}

async function getCourseLessonCounts(courseIds: string[]) {
  if (!courseIds.length) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("modules")
    .select("course_id, status, lessons(id, status)")
    .in("course_id", courseIds);

  const counts = new Map<string, number>();

  for (const moduleRow of data ?? []) {
    const isPublishedModule = moduleRow.status === "published";
    const publishedLessons =
      moduleRow.lessons?.filter((lesson: { status: string }) => isPublishedModule && lesson.status === "published")
        .length ?? 0;

    counts.set(moduleRow.course_id, (counts.get(moduleRow.course_id) ?? 0) + publishedLessons);
  }

  return counts;
}

async function getCompletedLessonCounts(enrollmentIds: string[]) {
  if (!enrollmentIds.length) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_progress")
    .select("enrollment_id")
    .in("enrollment_id", enrollmentIds)
    .eq("status", "completed");

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    counts.set(row.enrollment_id, (counts.get(row.enrollment_id) ?? 0) + 1);
  }

  return counts;
}

async function getLastActivityMap(studentIds: string[], enrollmentIds: string[]) {
  const byStudent = new Map<string, string>();
  const enrollmentToStudent = new Map<string, string>();

  if (!studentIds.length) {
    return byStudent;
  }

  const supabase = await createClient();

  const { data: actorEvents } = await supabase
    .from("activity_events")
    .select("actor_profile_id, created_at")
    .in("actor_profile_id", studentIds);

  for (const row of actorEvents ?? []) {
    if (!row.actor_profile_id) {
      continue;
    }

    const current = byStudent.get(row.actor_profile_id);
    if (!current || row.created_at > current) {
      byStudent.set(row.actor_profile_id, row.created_at);
    }
  }

  if (!enrollmentIds.length) {
    return byStudent;
  }

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, student_profile_id")
    .in("id", enrollmentIds);

  for (const row of enrollmentRows ?? []) {
    enrollmentToStudent.set(row.id, row.student_profile_id);
  }

  const { data: enrollmentEvents } = await supabase
    .from("activity_events")
    .select("enrollment_id, created_at")
    .in("enrollment_id", enrollmentIds);

  for (const row of enrollmentEvents ?? []) {
    if (!row.enrollment_id) {
      continue;
    }

    const studentId = enrollmentToStudent.get(row.enrollment_id);
    if (!studentId) {
      continue;
    }

    const current = byStudent.get(studentId);
    if (!current || row.created_at > current) {
      byStudent.set(studentId, row.created_at);
    }
  }

  return byStudent;
}

function buildProgressMap(enrollments: EnrollmentRecord[], lessonTotals: Map<string, number>, completedCounts: Map<string, number>) {
  const progress = new Map<string, number>();

  const grouped = new Map<string, { completed: number; total: number }>();

  for (const enrollment of enrollments) {
    const completed = completedCounts.get(enrollment.id) ?? 0;
    const total = lessonTotals.get(enrollment.course_id) ?? 0;
    const current = grouped.get(enrollment.student_profile_id) ?? { completed: 0, total: 0 };

    grouped.set(enrollment.student_profile_id, {
      completed: current.completed + completed,
      total: current.total + total,
    });
  }

  for (const [studentId, summary] of grouped.entries()) {
    const percentage = summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100);
    progress.set(studentId, percentage);
  }

  return progress;
}

export async function getAdminDashboardSummary() {
  await syncAuthUsersIntoProfiles();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const recentThresholdIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: studentCount },
    { count: newAccountsCount },
    { count: activeCourseCount },
    { count: upcomingLiveClassCount },
    { count: submissionCount },
    { count: adminCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .gte("created_at", recentThresholdIso),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("live_classes").select("*", { count: "exact", head: true }).eq("status", "published").gte("starts_at", nowIso),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
  ]);

  return {
    studentCount: studentCount ?? 0,
    newAccountsCount: newAccountsCount ?? 0,
    activeCourseCount: activeCourseCount ?? 0,
    upcomingLiveClassCount: upcomingLiveClassCount ?? 0,
    pendingSubmissionCount: submissionCount ?? 0,
    adminCount: adminCount ?? 0,
  };
}

export async function getAdminCourseOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id, title").order("title");
  return data ?? [];
}

export async function getAdminLiveClassFormOptions() {
  const supabase = await createClient();
  const [{ data: courseRows }, { data: cohortRows }] = await Promise.all([
    supabase.from("courses").select("id, title, status").in("status", ["draft", "published"]).order("title"),
    supabase.from("cohorts").select("id, course_id, name").order("name"),
  ]);

  const courses = (courseRows ?? []) as Array<{ id: string; title: string; status: string }>;
  const courseTitleById = new Map(courses.map((course) => [course.id, course.title]));

  return {
    courses,
    cohorts: (cohortRows ?? []).map((cohort) => ({
      ...cohort,
      courseTitle: courseTitleById.get(cohort.course_id) ?? "Curso",
    })),
  };
}

export async function getAdminAssignmentOptions(courseId?: string) {
  const supabase = await createClient();
  let query = supabase.from("assignments").select("id, title, course_id").order("title");

  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getAdminCountryOptions() {
  await syncAuthUsersIntoProfiles();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("country")
    .not("country", "is", null)
    .order("country");

  return Array.from(new Set((data ?? []).map((row) => row.country).filter(Boolean)));
}

export async function listStudents(params: {
  q?: string;
  courseId?: string;
  enrollmentStatus?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}) {
  await syncAuthUsersIntoProfiles();
  const supabase = await createClient();
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = params.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const searchPattern = getSearchPattern(params.q);
  let filteredStudentIds: string[] | null = null;

  if (params.courseId || params.enrollmentStatus) {
    let enrollmentFilterQuery = supabase.from("enrollments").select("student_profile_id");

    if (params.courseId) {
      enrollmentFilterQuery = enrollmentFilterQuery.eq("course_id", params.courseId);
    }

    if (params.enrollmentStatus) {
      enrollmentFilterQuery = enrollmentFilterQuery.eq("status", params.enrollmentStatus);
    }

    const { data: matchingEnrollments } = await enrollmentFilterQuery;
    filteredStudentIds = Array.from(new Set((matchingEnrollments ?? []).map((row) => row.student_profile_id)));

    if (!filteredStudentIds.length) {
      return {
        students: [],
        totalCount: 0,
        page,
        pageSize,
      };
    }
  }

  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, country, phone, age_range, created_at, account_status", { count: "exact" })
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchPattern) {
    query = query.or(
      `email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`,
    );
  }

  if (params.country) {
    query = query.eq("country", params.country);
  }

  if (filteredStudentIds) {
    query = query.in("id", filteredStudentIds);
  }

  const { data: profiles, count } = await query;
  const studentProfiles = ((profiles ?? []) as Record<string, unknown>[]).map(normalizeStudentProfileRecord);
  const studentIds = studentProfiles.map((student) => student.id);

  if (!studentIds.length) {
    return {
      students: [],
      totalCount: count ?? 0,
      page,
      pageSize,
    };
  }

  const { data: enrollmentData } = await supabase
    .from("enrollments")
    .select("id, student_profile_id, course_id, cohort_id, status, access_state, enrolled_at, completed_at, courses(id, title), cohorts(id, name)")
    .in("student_profile_id", studentIds)
    .order("enrolled_at", { ascending: false });

  const enrollments = ((enrollmentData ?? []) as Record<string, unknown>[]).map(normalizeEnrollmentRecord);
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));
  const [lessonTotals, completedCounts, lastActivity] = await Promise.all([
    getCourseLessonCounts(courseIds),
    getCompletedLessonCounts(enrollmentIds),
    getLastActivityMap(studentIds, enrollmentIds),
  ]);
  const progressByStudent = buildProgressMap(enrollments, lessonTotals, completedCounts);
  const enrollmentsByStudent = new Map<string, EnrollmentRecord[]>();

  for (const enrollment of enrollments) {
    const rows = enrollmentsByStudent.get(enrollment.student_profile_id) ?? [];
    rows.push(enrollment);
    enrollmentsByStudent.set(enrollment.student_profile_id, rows);
  }

  return {
    students: studentProfiles.map((student) => {
      const studentEnrollments = enrollmentsByStudent.get(student.id) ?? [];

      return {
        ...student,
        courseCount: studentEnrollments.length,
        progressPercentage: progressByStudent.get(student.id) ?? 0,
        lastActivityAt: lastActivity.get(student.id) ?? null,
        enrollments: studentEnrollments,
      };
    }),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function getStudentAdminDetail(studentId: string) {
  await syncAuthUsersIntoProfiles();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, country, phone, age_range, date_of_birth, occupation, created_at, account_status, role")
    .eq("id", studentId)
    .maybeSingle<AdminDirectoryProfileRecord>();

  if (!profile) {
    return null;
  }

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, student_profile_id, course_id, cohort_id, status, access_state, enrolled_at, completed_at, courses(id, title), cohorts(id, name)")
    .eq("student_profile_id", studentId)
    .order("enrolled_at", { ascending: false });

  const enrollments = ((enrollmentRows ?? []) as Record<string, unknown>[]).map(normalizeEnrollmentRecord);
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));
  const [lessonTotals, completedCounts, lastActivity] = await Promise.all([
    getCourseLessonCounts(courseIds),
    getCompletedLessonCounts(enrollmentIds),
    getLastActivityMap([studentId], enrollmentIds),
  ]);

  const { data: submissionRows } = await supabase
    .from("submissions")
    .select("id, assignment_id, enrollment_id, status, submitted_at, reviewed_at, instructor_feedback, reviewer_profile_id, is_late, created_at")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  const submissions = (submissionRows ?? []) as SubmissionRecord[];
  const assignmentIds = Array.from(new Set(submissions.map((submission) => submission.assignment_id)));

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, title, course_id, due_at, status")
    .in("id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const assignments = new Map<string, AssignmentRecord>(
    ((assignmentRows ?? []) as AssignmentRecord[]).map((assignment) => [assignment.id, assignment]),
  );

  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, title")
    .in(
      "id",
      Array.from(new Set((assignmentRows ?? []).map((assignment: { course_id: string }) => assignment.course_id))).length
        ? Array.from(new Set((assignmentRows ?? []).map((assignment: { course_id: string }) => assignment.course_id)))
        : [EMPTY_UUID],
    );

  const coursesById = new Map<string, { id: string; title: string }>((courseRows ?? []).map((course) => [course.id, course]));
  const progressByEnrollment = new Map<string, number>();

  for (const enrollment of enrollments) {
    const completed = completedCounts.get(enrollment.id) ?? 0;
    const total = lessonTotals.get(enrollment.course_id) ?? 0;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressByEnrollment.set(enrollment.id, percent);
  }

  const [{ data: tagRows }, { data: availableTagRows }, { data: liveClassRows }] = await Promise.all([
    supabase.from("user_tags").select("profile_id, created_at, tags(id, name, color, category, source, system_key)").eq("profile_id", studentId),
    supabase
      .from("tags")
      .select("id, name, color, category, source, system_key")
      .is("archived_at", null)
      .order("source", { ascending: true })
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("live_classes")
      .select("id, course_id, cohort_id, instructor_profile_id, title, starts_at, duration_minutes, meeting_url, status")
      .in("course_id", courseIds.length ? courseIds : [EMPTY_UUID])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
  ]);

  const normalizedAvailableTags = ((availableTagRows ?? []) as Record<string, unknown>[]).map(normalizeTagRecord);
  const profileTags = groupTagsByProfile(((tagRows ?? []) as Record<string, unknown>[]).map(normalizeUserTagRecord)).get(studentId) ?? [];
  const normalizedLiveClasses = (liveClassRows ?? []) as LiveClassRecord[];
  const instructorIds = toUniqueIds(normalizedLiveClasses.map((liveClass) => liveClass.instructor_profile_id));
  const liveClassCohortIds = toUniqueIds(normalizedLiveClasses.map((liveClass) => liveClass.cohort_id));
  const liveClassCourseIds = toUniqueIds(normalizedLiveClasses.map((liveClass) => liveClass.course_id));
  const [{ data: liveCourseRows }, { data: liveInstructorRows }, { data: liveCohortRows }] = await Promise.all([
    supabase.from("courses").select("id, title").in("id", liveClassCourseIds.length ? liveClassCourseIds : [EMPTY_UUID]),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name")
      .in("id", instructorIds.length ? instructorIds : [EMPTY_UUID]),
    supabase.from("cohorts").select("id, name").in("id", liveClassCohortIds.length ? liveClassCohortIds : [EMPTY_UUID]),
  ]);
  const liveCoursesById = new Map<string, { id: string; title: string }>((liveCourseRows ?? []).map((course) => [course.id, course]));
  const instructorsById = new Map<string, { id: string; first_name: string; last_name: string; display_name: string | null }>(
    (liveInstructorRows ?? []).map((row) => [row.id, row]),
  );
  const cohortsById = new Map<string, { id: string; name: string }>((liveCohortRows ?? []).map((row) => [row.id, row]));
  const relevantLiveClasses = normalizedLiveClasses.filter((liveClass) => {
    return enrollments.some((enrollment) => enrollment.course_id === liveClass.course_id && (!liveClass.cohort_id || liveClass.cohort_id === enrollment.cohort_id));
  });

  return {
    profile,
    lastActivityAt: lastActivity.get(studentId) ?? null,
    tags: profileTags,
    availableTags: normalizedAvailableTags,
    enrollments: enrollments.map((enrollment) => ({
      ...enrollment,
      progressPercentage: progressByEnrollment.get(enrollment.id) ?? 0,
      completedLessons: completedCounts.get(enrollment.id) ?? 0,
      totalLessons: lessonTotals.get(enrollment.course_id) ?? 0,
    })),
    submissions: submissions.map((submission) => {
      const assignment = assignments.get(submission.assignment_id);
      return {
        ...submission,
        assignment,
        course: assignment ? coursesById.get(assignment.course_id) ?? null : null,
      };
    }),
    liveClasses: relevantLiveClasses.map((liveClass) => {
      const instructor = instructorsById.get(liveClass.instructor_profile_id) ?? null;
      return {
        ...liveClass,
        course: liveCoursesById.get(liveClass.course_id) ?? null,
        cohort: liveClass.cohort_id ? cohortsById.get(liveClass.cohort_id) ?? null : null,
        instructor_name:
          instructor?.display_name?.trim() || `${instructor?.first_name ?? "Equipo"} ${instructor?.last_name ?? "UniCourse"}`.trim(),
      };
    }),
  };
}

export async function listAdmins(search?: string) {
  const supabase = await createClient();
  const searchPattern = getSearchPattern(search);
  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, role, created_at")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: true });

  if (searchPattern) {
    query = query.or(
      `email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`,
    );
  }

  const { data } = await query;
  const admins = data ?? [];
  const adminIds = admins.map((admin) => admin.id);
  const { data: auditRows } = await supabase
    .from("admin_audit_logs")
    .select("target_user_id, action, created_at")
    .in("target_user_id", adminIds.length ? adminIds : [EMPTY_UUID])
    .in("action", ["bootstrap_super_admin", "user_promoted_to_admin"])
    .order("created_at", { ascending: false });

  const assignedAtByAdminId = new Map<string, string>();

  for (const row of auditRows ?? []) {
    if (!row.target_user_id || assignedAtByAdminId.has(row.target_user_id)) {
      continue;
    }

    assignedAtByAdminId.set(row.target_user_id, row.created_at);
  }

  return admins.map((admin) => ({
    ...admin,
    assigned_at: assignedAtByAdminId.get(admin.id) ?? admin.created_at,
  }));
}

export async function listStudentsForRoleManagement(search?: string) {
  await syncAuthUsersIntoProfiles();
  const supabase = await createClient();
  const searchPattern = getSearchPattern(search);
  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, role, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(24);

  if (searchPattern) {
    query = query.or(
      `email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`,
    );
  }

  const { data } = await query;
  return data ?? [];
}

export async function listCourses(params: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const supabase = await createClient();
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = params.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const searchPattern = getSearchPattern(params.q);

  let query = supabase
    .from("courses")
    .select("id, title, slug, short_description, full_description, difficulty, estimated_duration_minutes, status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchPattern) {
    query = query.or(`title.ilike.${searchPattern},slug.ilike.${searchPattern}`);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, count } = await query;
  const courses = (data ?? []) as CourseRecord[];
  const courseIds = courses.map((course) => course.id);

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("course_id")
    .in("course_id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]);

  const counts = new Map<string, number>();
  for (const row of enrollmentRows ?? []) {
    counts.set(row.course_id, (counts.get(row.course_id) ?? 0) + 1);
  }

  return {
    courses: courses.map((course) => ({
      ...course,
      enrolledStudentsCount: counts.get(course.id) ?? 0,
    })),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function listSubmissions(params: {
  q?: string;
  courseId?: string;
  assignmentId?: string;
  reviewStatus?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = params.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const searchPattern = getSearchPattern(params.q);

  let allowedAssignmentIds: string[] | null = null;
  let allowedEnrollmentIds: string[] | null = null;

  if (params.courseId) {
    const { data: courseAssignments } = await supabase
      .from("assignments")
      .select("id")
      .eq("course_id", params.courseId);

    allowedAssignmentIds = (courseAssignments ?? []).map((assignment) => assignment.id);
  }

  if (params.assignmentId) {
    allowedAssignmentIds = [params.assignmentId];
  }

  if (searchPattern) {
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .or(`email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`);

    const studentIds = (matchingProfiles ?? []).map((profile) => profile.id);
    const { data: matchingEnrollments } = await supabase
      .from("enrollments")
      .select("id")
      .in("student_profile_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

    allowedEnrollmentIds = (matchingEnrollments ?? []).map((enrollment) => enrollment.id);
  }

  let query = supabase
    .from("submissions")
    .select("id, assignment_id, enrollment_id, status, submitted_at, reviewed_at, instructor_feedback, reviewer_profile_id, is_late, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.reviewStatus) {
    query = query.eq("status", params.reviewStatus);
  }

  if (allowedAssignmentIds) {
    query = query.in(
      "assignment_id",
      allowedAssignmentIds.length ? allowedAssignmentIds : ["00000000-0000-0000-0000-000000000000"],
    );
  }

  if (allowedEnrollmentIds) {
    query = query.in(
      "enrollment_id",
      allowedEnrollmentIds.length ? allowedEnrollmentIds : ["00000000-0000-0000-0000-000000000000"],
    );
  }

  const { data: submissionRows, count } = await query;
  const submissions = (submissionRows ?? []) as SubmissionRecord[];
  const assignmentIds = Array.from(new Set(submissions.map((submission) => submission.assignment_id)));
  const enrollmentIds = Array.from(new Set(submissions.map((submission) => submission.enrollment_id)));

  const [{ data: assignments }, { data: enrollments }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, course_id, due_at, status")
      .in("id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("enrollments")
      .select("id, student_profile_id, course_id, status")
      .in("id", enrollmentIds.length ? enrollmentIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const assignmentsById = new Map<string, AssignmentRecord>(
    ((assignments ?? []) as AssignmentRecord[]).map((assignment) => [assignment.id, assignment]),
  );
  const enrollmentsById = new Map<string, { id: string; student_profile_id: string; course_id: string; status: string }>(
    (enrollments ?? []).map((enrollment) => [enrollment.id, enrollment]),
  );

  const courseIds = Array.from(new Set((assignments ?? []).map((assignment) => assignment.course_id)));
  const studentIds = Array.from(new Set((enrollments ?? []).map((enrollment) => enrollment.student_profile_id)));

  const [{ data: courses }, { data: profiles }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const coursesById = new Map<string, { id: string; title: string }>((courses ?? []).map((course) => [course.id, course]));
  const profilesById = new Map<string, { id: string; first_name: string; last_name: string; email: string }>(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return {
    submissions: submissions.map((submission) => {
      const assignment = assignmentsById.get(submission.assignment_id) ?? null;
      const enrollment = enrollmentsById.get(submission.enrollment_id) ?? null;
      const student = enrollment ? profilesById.get(enrollment.student_profile_id) ?? null : null;
      const course = assignment ? coursesById.get(assignment.course_id) ?? null : null;

      return {
        ...submission,
        assignment,
        enrollment,
        student,
        course,
      };
    }),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function getStudentEnrollmentOptions(studentId: string) {
  const supabase = await createClient();
  const [{ data: courses }, { data: existing }] = await Promise.all([
    supabase.from("courses").select("id, title, status").order("title"),
    supabase.from("enrollments").select("course_id").eq("student_profile_id", studentId),
  ]);

  const existingCourseIds = new Set((existing ?? []).map((row) => row.course_id));

  return (courses ?? []).filter((course) => !existingCourseIds.has(course.id));
}

export async function getAdminTagOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, name, color, category, source, system_key")
    .is("archived_at", null)
    .order("source", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map(normalizeTagRecord);
}

export async function getAdminRegionOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, name, color, category, source, system_key")
    .eq("source", "automatic")
    .eq("category", "region")
    .is("archived_at", null)
    .order("name", { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map(normalizeTagRecord);
}

export async function listAdminProfiles(params: {
  q?: string;
  courseId?: string;
  country?: string;
  regionTagId?: string;
  ageRange?: string;
  role?: string;
  accountStatus?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
}) {
  await syncAuthUsersIntoProfiles();
  const supabase = await createClient();
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = params.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const searchPattern = getSearchPattern(params.q);
  let filteredProfileIds: string[] | null = null;

  if (params.courseId) {
    const { data: matchingEnrollments } = await supabase
      .from("enrollments")
      .select("student_profile_id")
      .eq("course_id", params.courseId);

    filteredProfileIds = intersectIds(filteredProfileIds, (matchingEnrollments ?? []).map((row) => row.student_profile_id));
  }

  if (params.tagId) {
    const { data: taggedRows } = await supabase
      .from("user_tags")
      .select("profile_id")
      .eq("tag_id", params.tagId);

    filteredProfileIds = intersectIds(filteredProfileIds, (taggedRows ?? []).map((row) => row.profile_id));
  }

  if (params.regionTagId) {
    const { data: regionRows } = await supabase
      .from("user_tags")
      .select("profile_id")
      .eq("tag_id", params.regionTagId);

    filteredProfileIds = intersectIds(filteredProfileIds, (regionRows ?? []).map((row) => row.profile_id));
  }

  if (filteredProfileIds && !filteredProfileIds.length) {
    return {
      profiles: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }

  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, country, phone, age_range, date_of_birth, occupation, created_at, account_status, role", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchPattern) {
    query = query.or(`email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`);
  }

  if (params.country) {
    query = query.eq("country", params.country);
  }

  if (params.ageRange) {
    query = query.eq("age_range", params.ageRange);
  }

  if (params.role) {
    query = query.eq("role", params.role);
  }

  if (params.accountStatus) {
    query = query.eq("account_status", params.accountStatus);
  }

  if (filteredProfileIds) {
    query = query.in("id", filteredProfileIds);
  }

  const { data: profiles, count } = await query;
  const normalizedProfiles = ((profiles ?? []) as Record<string, unknown>[]).map(normalizeAdminDirectoryProfileRecord);
  const profileIds = normalizedProfiles.map((profile) => profile.id);

  if (!profileIds.length) {
    return {
      profiles: [],
      totalCount: count ?? 0,
      page,
      pageSize,
    };
  }

  const [{ data: enrollmentRows }, { data: userTagRows }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, student_profile_id, course_id, status, access_state, courses(id, title)")
      .in("student_profile_id", profileIds)
      .order("enrolled_at", { ascending: false }),
    supabase.from("user_tags").select("profile_id, created_at, tags(id, name, color, category, source, system_key)").in("profile_id", profileIds),
  ]);

  const enrollments = ((enrollmentRows ?? []) as Record<string, unknown>[]).map(normalizeEnrollmentRecord);
  const tagsByProfile = groupTagsByProfile(((userTagRows ?? []) as Record<string, unknown>[]).map(normalizeUserTagRecord));
  const enrollmentsByProfile = new Map<
    string,
    Array<{
      id: string;
      course_id: string;
      status: string;
      access_state: string;
      title: string;
    }>
  >();

  for (const enrollment of enrollments) {
    const current = enrollmentsByProfile.get(enrollment.student_profile_id) ?? [];
    current.push({
      id: enrollment.id,
      course_id: enrollment.course_id,
      status: enrollment.status,
      access_state: enrollment.access_state,
      title: enrollment.courses?.title ?? "Curso sin título",
    });
    enrollmentsByProfile.set(enrollment.student_profile_id, current);
  }

  return {
    profiles: normalizedProfiles.map((profile) => {
      const profileEnrollments = enrollmentsByProfile.get(profile.id) ?? [];

      return {
        ...profile,
        courseCount: profileEnrollments.length,
        enrollments: profileEnrollments,
        tags: tagsByProfile.get(profile.id) ?? [],
      };
    }),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function getAdminLiveClassSnapshot(limit = 6) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ count: publishedCount }, { count: draftCount }, { count: upcomingCount }, { data: liveClassRows }] = await Promise.all([
    supabase.from("live_classes").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("live_classes").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("live_classes").select("*", { count: "exact", head: true }).eq("status", "published").gte("starts_at", nowIso),
    supabase
      .from("live_classes")
      .select(
        "id, course_id, cohort_id, instructor_profile_id, title, description, starts_at, duration_minutes, meeting_url, google_calendar_event_id, google_calendar_html_link, student_invite_count, calendar_last_synced_at, status",
      )
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(limit),
  ]);

  const liveClasses = (liveClassRows ?? []) as LiveClassRecord[];
  const courseIds = toUniqueIds(liveClasses.map((liveClass) => liveClass.course_id));
  const cohortIds = toUniqueIds(liveClasses.map((liveClass) => liveClass.cohort_id));
  const instructorIds = toUniqueIds(liveClasses.map((liveClass) => liveClass.instructor_profile_id));

  const [{ data: courseRows }, { data: cohortRows }, { data: instructorRows }] = await Promise.all([
    supabase.from("courses").select("id, title").in("id", courseIds.length ? courseIds : [EMPTY_UUID]),
    supabase.from("cohorts").select("id, name").in("id", cohortIds.length ? cohortIds : [EMPTY_UUID]),
    supabase.from("profiles").select("id, first_name, last_name, display_name").in("id", instructorIds.length ? instructorIds : [EMPTY_UUID]),
  ]);

  const coursesById = new Map<string, { id: string; title: string }>((courseRows ?? []).map((course) => [course.id, course]));
  const cohortsById = new Map<string, { id: string; name: string }>((cohortRows ?? []).map((cohort) => [cohort.id, cohort]));
  const instructorsById = new Map<string, { id: string; first_name: string; last_name: string; display_name: string | null }>(
    (instructorRows ?? []).map((row) => [row.id, row]),
  );

  return {
    publishedCount: publishedCount ?? 0,
    draftCount: draftCount ?? 0,
    upcomingCount: upcomingCount ?? 0,
    classes: liveClasses.map((liveClass) => {
      const instructor = instructorsById.get(liveClass.instructor_profile_id) ?? null;
      return {
        ...liveClass,
        course: coursesById.get(liveClass.course_id) ?? null,
        cohort: liveClass.cohort_id ? cohortsById.get(liveClass.cohort_id) ?? null : null,
        student_invite_count: liveClass.student_invite_count ?? 0,
        instructor_name:
          instructor?.display_name?.trim() || `${instructor?.first_name ?? "Equipo"} ${instructor?.last_name ?? "UniCourse"}`.trim(),
      };
    }),
  };
}
