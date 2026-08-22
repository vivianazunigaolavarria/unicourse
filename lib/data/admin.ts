import "server-only";

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
  created_at: string;
  account_status: string;
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

function takeFirst<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeStudentProfileRecord(row: Record<string, unknown>) {
  return row as unknown as StudentProfileRecord;
}

function normalizeEnrollmentRecord(row: Record<string, unknown>) {
  return {
    ...row,
    courses: takeFirst(row.courses as EnrollmentRecord["courses"] | EnrollmentRecord["courses"][]),
    cohorts: takeFirst(row.cohorts as EnrollmentRecord["cohorts"] | EnrollmentRecord["cohorts"][]),
  } as EnrollmentRecord;
}

function getSearchPattern(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replaceAll(",", " ");
  return `%${normalized}%`;
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
  const supabase = await createClient();

  const [
    { count: studentCount },
    { count: courseCount },
    { count: submissionCount },
    { count: adminCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
  ]);

  return {
    studentCount: studentCount ?? 0,
    courseCount: courseCount ?? 0,
    pendingSubmissionCount: submissionCount ?? 0,
    adminCount: adminCount ?? 0,
  };
}

export async function getAdminCourseOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id, title").order("title");
  return data ?? [];
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("country")
    .eq("role", "student")
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
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, country, phone, age_range, created_at, account_status")
    .eq("id", studentId)
    .maybeSingle<StudentProfileRecord>();

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
      Array.from(new Set((assignmentRows ?? []).map((assignment: { course_id: string }) => assignment.course_id))),
    );

  const coursesById = new Map<string, { id: string; title: string }>((courseRows ?? []).map((course) => [course.id, course]));
  const progressByEnrollment = new Map<string, number>();

  for (const enrollment of enrollments) {
    const completed = completedCounts.get(enrollment.id) ?? 0;
    const total = lessonTotals.get(enrollment.course_id) ?? 0;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressByEnrollment.set(enrollment.id, percent);
  }

  return {
    profile,
    lastActivityAt: lastActivity.get(studentId) ?? null,
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
  return data ?? [];
}

export async function listStudentsForRoleManagement(search?: string) {
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
