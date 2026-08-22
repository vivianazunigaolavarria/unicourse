import "server-only";

import { createClient } from "@/lib/supabase/server";

type StudentEnrollment = {
  id: string;
  student_profile_id: string;
  course_id: string;
  cohort_id: string | null;
  status: string;
  access_state: string;
  enrolled_at: string;
  completed_at: string | null;
  courses: { id: string; title: string; status: string } | null;
  cohorts: { id: string; name: string } | null;
};

type StudentAssignment = {
  id: string;
  course_id: string;
  cohort_id: string | null;
  title: string;
  due_at: string | null;
  status: string;
  allow_late_submissions: boolean;
};

type StudentSubmission = {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  is_late: boolean;
  created_at: string;
};

type StudentLiveClass = {
  id: string;
  course_id: string;
  cohort_id: string | null;
  instructor_profile_id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: string;
};

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function takeFirst<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeStudentEnrollment(row: Record<string, unknown>) {
  return {
    ...row,
    courses: takeFirst(row.courses as StudentEnrollment["courses"] | StudentEnrollment["courses"][]),
    cohorts: takeFirst(row.cohorts as StudentEnrollment["cohorts"] | StudentEnrollment["cohorts"][]),
  } as StudentEnrollment;
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
    const publishedLessons =
      moduleRow.lessons?.filter((lesson: { status: string }) => moduleRow.status === "published" && lesson.status === "published")
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

export async function getStudentPortalSnapshot(studentId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, phone, country, age_range, created_at, account_status")
    .eq("id", studentId)
    .maybeSingle();

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, student_profile_id, course_id, cohort_id, status, access_state, enrolled_at, completed_at, courses(id, title, status), cohorts(id, name)")
    .eq("student_profile_id", studentId)
    .order("enrolled_at", { ascending: false });

  const enrollments = ((enrollmentRows ?? []) as Record<string, unknown>[]).map(normalizeStudentEnrollment);
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const courseIds = unique(enrollments.map((enrollment) => enrollment.course_id));
  const cohortIds = unique(enrollments.map((enrollment) => enrollment.cohort_id).filter(Boolean)) as string[];
  const [lessonTotals, completedCounts] = await Promise.all([
    getCourseLessonCounts(courseIds),
    getCompletedLessonCounts(enrollmentIds),
  ]);

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, course_id, cohort_id, title, due_at, status, allow_late_submissions")
    .in("course_id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "published")
    .order("due_at", { ascending: true });

  const { data: submissionRows } = await supabase
    .from("submissions")
    .select("id, assignment_id, enrollment_id, status, submitted_at, reviewed_at, is_late, created_at")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: liveClassRows } = await supabase
    .from("live_classes")
    .select("id, course_id, cohort_id, instructor_profile_id, title, starts_at, duration_minutes, meeting_url, status")
    .in("course_id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  const { data: lastActivityRows } = await supabase
    .from("activity_events")
    .select("created_at")
    .eq("actor_profile_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1);

  const enrollmentByCourse = new Map<string, StudentEnrollment[]>();
  for (const enrollment of enrollments) {
    const rows = enrollmentByCourse.get(enrollment.course_id) ?? [];
    rows.push(enrollment);
    enrollmentByCourse.set(enrollment.course_id, rows);
  }

  const courseById = new Map(
    enrollments
      .filter((enrollment) => enrollment.courses)
      .map((enrollment) => [enrollment.course_id, enrollment.courses]),
  );

  const submissionsByAssignment = new Map<string, StudentSubmission>();
  for (const submission of (submissionRows ?? []) as StudentSubmission[]) {
    const current = submissionsByAssignment.get(submission.assignment_id);
    if (!current || submission.created_at > current.created_at) {
      submissionsByAssignment.set(submission.assignment_id, submission);
    }
  }

  const instructorIds = unique(
    ((liveClassRows ?? []) as StudentLiveClass[]).map((liveClass) => liveClass.instructor_profile_id),
  );

  const { data: instructorRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", instructorIds.length ? instructorIds : ["00000000-0000-0000-0000-000000000000"]);

  const instructorsById = new Map(
    (instructorRows ?? []).map((row) => [row.id, `${row.first_name} ${row.last_name}`.trim()]),
  );

  const courseProgress = enrollments.map((enrollment) => {
    const totalLessons = lessonTotals.get(enrollment.course_id) ?? 0;
    const completedLessons = completedCounts.get(enrollment.id) ?? 0;
    const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    return {
      ...enrollment,
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  });

  const relevantAssignments = ((assignmentRows ?? []) as StudentAssignment[]).filter((assignment) => {
    const matchingEnrollments = enrollmentByCourse.get(assignment.course_id) ?? [];
    return matchingEnrollments.some((enrollment) => !assignment.cohort_id || assignment.cohort_id === enrollment.cohort_id);
  });

  const relevantLiveClasses = ((liveClassRows ?? []) as StudentLiveClass[]).filter((liveClass) => {
    const matchingEnrollments = enrollmentByCourse.get(liveClass.course_id) ?? [];
    return matchingEnrollments.some((enrollment) => !liveClass.cohort_id || liveClass.cohort_id === enrollment.cohort_id);
  });

  return {
    profile,
    enrollments: courseProgress,
    assignments: relevantAssignments.map((assignment) => ({
      ...assignment,
      course: courseById.get(assignment.course_id) ?? null,
      submission: submissionsByAssignment.get(assignment.id) ?? null,
    })),
    liveClasses: relevantLiveClasses.map((liveClass) => ({
      ...liveClass,
      instructor_name: instructorsById.get(liveClass.instructor_profile_id) ?? "Equipo UniCourse",
      course: courseById.get(liveClass.course_id) ?? null,
    })),
    lastActivityAt: lastActivityRows?.[0]?.created_at ?? null,
    availableCourseIds: courseIds,
    availableCohortIds: cohortIds,
  };
}
