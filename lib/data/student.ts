import "server-only";

import { createClient } from "@/lib/supabase/server";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

type StudentSupabase = Awaited<ReturnType<typeof createClient>>;

type StudentCourseRecord = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  difficulty: string;
  estimated_duration_minutes: number | null;
  status: string;
  created_at: string;
};

type StudentEnrollmentRecord = {
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

type StudentAssignmentRecord = {
  id: string;
  course_id: string;
  cohort_id: string | null;
  title: string;
  due_at: string | null;
  status: string;
  allow_late_submissions: boolean;
};

export type StudentSubmissionRecord = {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  instructor_feedback: string | null;
  is_late: boolean;
  created_at: string;
};

type StudentLiveClassRecord = {
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

type StudentProfileRecord = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  age_range: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  role: string;
  created_at: string;
  account_status: string;
};

type PublishedLesson = {
  id: string;
  position: number;
};

type PublishedModule = {
  id: string;
  title: string;
  position: number;
  lessons: PublishedLesson[];
};

export type StudentModuleProgress = {
  id: string;
  title: string;
  position: number;
  totalLessons: number;
  completedLessons: number;
};

export type StudentEnrollmentProgress = StudentEnrollmentRecord & {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  totalModuleCount: number;
  currentModuleIndex: number | null;
  currentModuleTitle: string | null;
  moduleProgress: StudentModuleProgress[];
};

export type StudentAssignmentSummary = StudentAssignmentRecord & {
  course: StudentEnrollmentRecord["courses"];
  submission: StudentSubmissionRecord | null;
  studentStatus: "pending" | "submitted" | "reviewed";
};

export type StudentLiveClassSummary = StudentLiveClassRecord & {
  instructor_name: string;
  course: StudentEnrollmentRecord["courses"];
  canJoin: boolean;
};

export type StudentRecommendedCourse = Pick<
  StudentCourseRecord,
  "id" | "title" | "slug" | "short_description" | "difficulty" | "estimated_duration_minutes"
> & {
  enrolledStudentsCount: number;
};

export type StudentPortalSnapshot = {
  profile: StudentProfileRecord | null;
  enrollments: StudentEnrollmentProgress[];
  assignments: StudentAssignmentSummary[];
  liveClasses: StudentLiveClassSummary[];
  recommendedCourses: StudentRecommendedCourse[];
  lastActivityAt: string | null;
  availableCourseIds: string[];
  availableCohortIds: string[];
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
    courses: takeFirst(row.courses as StudentEnrollmentRecord["courses"] | StudentEnrollmentRecord["courses"][]),
    cohorts: takeFirst(row.cohorts as StudentEnrollmentRecord["cohorts"] | StudentEnrollmentRecord["cohorts"][]),
  } as StudentEnrollmentRecord;
}

function normalizePublishedModules(rows: Array<Record<string, unknown>> | null | undefined) {
  const modulesByCourse = new Map<string, PublishedModule[]>();

  for (const row of rows ?? []) {
    if (row.status !== "published") {
      continue;
    }

    const courseId = String(row.course_id);
    const lessons = Array.isArray(row.lessons)
      ? row.lessons
          .filter((lesson) => lesson && typeof lesson === "object" && lesson.status === "published")
          .map((lesson) => ({
            id: String(lesson.id),
            position: typeof lesson.position === "number" ? lesson.position : 0,
          }))
          .sort((left, right) => left.position - right.position)
      : [];

    const modules = modulesByCourse.get(courseId) ?? [];
    modules.push({
      id: String(row.id),
      title: typeof row.title === "string" && row.title.trim() ? row.title : "Módulo",
      position: typeof row.position === "number" ? row.position : 0,
      lessons,
    });
    modulesByCourse.set(courseId, modules);
  }

  for (const modules of modulesByCourse.values()) {
    modules.sort((left, right) => left.position - right.position);
  }

  return modulesByCourse;
}

function getStudentAssignmentStatus(submission: StudentSubmissionRecord | null): "pending" | "submitted" | "reviewed" {
  if (!submission) {
    return "pending";
  }

  if (
    submission.reviewed_at ||
    submission.status === "reviewed" ||
    submission.status === "approved" ||
    submission.status === "changes_requested"
  ) {
    return "reviewed";
  }

  return "submitted";
}

function canJoinLiveClass(startsAt: string, durationMinutes: number, meetingUrl: string | null) {
  if (!meetingUrl) {
    return false;
  }

  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const joinWindowStarts = start - 15 * 60_000;
  const joinWindowEnds = start + Math.max(durationMinutes, 30) * 60_000;

  return now >= joinWindowStarts && now <= joinWindowEnds;
}

async function getPublishedModules(supabase: StudentSupabase, courseIds: string[]) {
  if (!courseIds.length) {
    return new Map<string, PublishedModule[]>();
  }

  const { data } = await supabase
    .from("modules")
    .select("id, course_id, title, position, status, lessons(id, status, position)")
    .in("course_id", courseIds);

  return normalizePublishedModules((data ?? []) as Array<Record<string, unknown>>);
}

async function getCompletedLessonSets(supabase: StudentSupabase, enrollmentIds: string[]) {
  const byEnrollment = new Map<string, Set<string>>();

  if (!enrollmentIds.length) {
    return byEnrollment;
  }

  const { data } = await supabase
    .from("lesson_progress")
    .select("enrollment_id, lesson_id")
    .in("enrollment_id", enrollmentIds)
    .eq("status", "completed");

  for (const row of data ?? []) {
    const lessons = byEnrollment.get(row.enrollment_id) ?? new Set<string>();
    lessons.add(row.lesson_id);
    byEnrollment.set(row.enrollment_id, lessons);
  }

  return byEnrollment;
}

async function getRecommendedPublishedCourses(supabase: StudentSupabase, excludedCourseIds: string[]) {
  const { data } = await supabase
    .from("courses")
    .select("id, title, slug, short_description, difficulty, estimated_duration_minutes, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(8);

  const publishedCourses = ((data ?? []) as StudentCourseRecord[]).filter((course) => !excludedCourseIds.includes(course.id)).slice(0, 3);
  const courseIds = publishedCourses.map((course) => course.id);

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("course_id")
    .in("course_id", courseIds.length ? courseIds : [EMPTY_UUID]);

  const enrollmentCounts = new Map<string, number>();
  for (const row of enrollmentRows ?? []) {
    enrollmentCounts.set(row.course_id, (enrollmentCounts.get(row.course_id) ?? 0) + 1);
  }

  return publishedCourses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    short_description: course.short_description,
    difficulty: course.difficulty,
    estimated_duration_minutes: course.estimated_duration_minutes,
    enrolledStudentsCount: enrollmentCounts.get(course.id) ?? 0,
  }));
}

export async function getStudentPortalSnapshot(studentId: string): Promise<StudentPortalSnapshot> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, phone, country, age_range, date_of_birth, occupation, role, created_at, account_status")
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

  const [publishedModulesByCourse, completedLessonSets, recommendedCourses] = await Promise.all([
    getPublishedModules(supabase, courseIds),
    getCompletedLessonSets(supabase, enrollmentIds),
    getRecommendedPublishedCourses(supabase, courseIds),
  ]);

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, course_id, cohort_id, title, due_at, status, allow_late_submissions")
    .in("course_id", courseIds.length ? courseIds : [EMPTY_UUID])
    .eq("status", "published")
    .order("due_at", { ascending: true });

  const { data: submissionRows } = await supabase
    .from("submissions")
    .select("id, assignment_id, enrollment_id, status, submitted_at, reviewed_at, instructor_feedback, is_late, created_at")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : [EMPTY_UUID]);

  const { data: liveClassRows } = await supabase
    .from("live_classes")
    .select("id, course_id, cohort_id, instructor_profile_id, title, starts_at, duration_minutes, meeting_url, status")
    .in("course_id", courseIds.length ? courseIds : [EMPTY_UUID])
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  const { data: lastActivityRows } = await supabase
    .from("activity_events")
    .select("created_at")
    .eq("actor_profile_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1);

  const enrollmentByCourse = new Map<string, StudentEnrollmentRecord[]>();
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

  const submissionsByAssignment = new Map<string, StudentSubmissionRecord>();
  for (const submission of (submissionRows ?? []) as StudentSubmissionRecord[]) {
    const current = submissionsByAssignment.get(submission.assignment_id);
    if (!current || submission.created_at > current.created_at) {
      submissionsByAssignment.set(submission.assignment_id, submission);
    }
  }

  const instructorIds = unique(
    ((liveClassRows ?? []) as StudentLiveClassRecord[]).map((liveClass) => liveClass.instructor_profile_id),
  );

  const { data: instructorRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", instructorIds.length ? instructorIds : [EMPTY_UUID]);

  const instructorsById = new Map(
    (instructorRows ?? []).map((row) => [row.id, `${row.first_name} ${row.last_name}`.trim() || "Equipo UniCourse"]),
  );

  const courseProgress = enrollments.map((enrollment) => {
    const modules = publishedModulesByCourse.get(enrollment.course_id) ?? [];
    const completedLessonIds = completedLessonSets.get(enrollment.id) ?? new Set<string>();
    const moduleProgress = modules.map((module) => {
      const completedLessons = module.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;

      return {
        id: module.id,
        title: module.title,
        position: module.position,
        totalLessons: module.lessons.length,
        completedLessons,
      };
    });

    const totalLessons = moduleProgress.reduce((sum, module) => sum + module.totalLessons, 0);
    const completedLessons = moduleProgress.reduce((sum, module) => sum + module.completedLessons, 0);
    const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    const nextModuleIndex = moduleProgress.findIndex((module) => module.completedLessons < module.totalLessons);
    const currentModule =
      nextModuleIndex >= 0
        ? moduleProgress[nextModuleIndex]
        : moduleProgress.length > 0
          ? moduleProgress[moduleProgress.length - 1]
          : null;

    return {
      ...enrollment,
      totalLessons,
      completedLessons,
      progressPercentage,
      totalModuleCount: moduleProgress.length,
      currentModuleIndex: currentModule ? moduleProgress.findIndex((module) => module.id === currentModule.id) + 1 : null,
      currentModuleTitle: currentModule?.title ?? null,
      moduleProgress,
    };
  });

  const relevantAssignments = ((assignmentRows ?? []) as StudentAssignmentRecord[]).filter((assignment) => {
    const matchingEnrollments = enrollmentByCourse.get(assignment.course_id) ?? [];
    return matchingEnrollments.some((enrollment) => !assignment.cohort_id || assignment.cohort_id === enrollment.cohort_id);
  });

  const relevantLiveClasses = ((liveClassRows ?? []) as StudentLiveClassRecord[]).filter((liveClass) => {
    const matchingEnrollments = enrollmentByCourse.get(liveClass.course_id) ?? [];
    return matchingEnrollments.some((enrollment) => !liveClass.cohort_id || liveClass.cohort_id === enrollment.cohort_id);
  });

  return {
    profile: (profile as StudentProfileRecord | null) ?? null,
    enrollments: courseProgress,
    assignments: relevantAssignments.map((assignment) => {
      const submission = submissionsByAssignment.get(assignment.id) ?? null;

      return {
        ...assignment,
        course: courseById.get(assignment.course_id) ?? null,
        submission,
        studentStatus: getStudentAssignmentStatus(submission),
      };
    }),
    liveClasses: relevantLiveClasses.map((liveClass) => ({
      ...liveClass,
      instructor_name: instructorsById.get(liveClass.instructor_profile_id) ?? "Equipo UniCourse",
      course: courseById.get(liveClass.course_id) ?? null,
      canJoin: canJoinLiveClass(liveClass.starts_at, liveClass.duration_minutes, liveClass.meeting_url),
    })),
    recommendedCourses,
    lastActivityAt: lastActivityRows?.[0]?.created_at ?? null,
    availableCourseIds: courseIds,
    availableCohortIds: cohortIds,
  };
}
