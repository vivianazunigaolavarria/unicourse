import type { StudentAssignmentSummary, StudentEnrollmentProgress, StudentLiveClassSummary, StudentPortalSnapshot } from "@/lib/data/student";

function compareAscendingDates(left: string | null | undefined, right: string | null | undefined) {
  const leftValue = left ? new Date(left).getTime() : Number.POSITIVE_INFINITY;
  const rightValue = right ? new Date(right).getTime() : Number.POSITIVE_INFINITY;
  return leftValue - rightValue;
}

function compareDescendingDates(left: string | null | undefined, right: string | null | undefined) {
  const leftValue = left ? new Date(left).getTime() : 0;
  const rightValue = right ? new Date(right).getTime() : 0;
  return rightValue - leftValue;
}

export function getVisibleEnrollments(enrollments: StudentEnrollmentProgress[]) {
  return enrollments.filter((enrollment) => enrollment.access_state === "enabled" && enrollment.status !== "revoked");
}

export function getUpcomingLiveClasses(liveClasses: StudentLiveClassSummary[], now = new Date()) {
  const currentTime = now.getTime();

  return liveClasses
    .filter((liveClass) => {
      const startsAt = new Date(liveClass.starts_at).getTime();
      const endsAt = startsAt + Math.max(liveClass.duration_minutes, 30) * 60_000;
      return endsAt >= currentTime;
    })
    .sort((left, right) => compareAscendingDates(left.starts_at, right.starts_at));
}

export function getNextLiveClass(liveClasses: StudentLiveClassSummary[], now = new Date()) {
  return getUpcomingLiveClasses(liveClasses, now)[0] ?? null;
}

export function getPendingAssignments(assignments: StudentAssignmentSummary[]) {
  return assignments
    .filter((assignment) => assignment.studentStatus === "pending" || assignment.studentStatus === "submitted")
    .sort((left, right) => compareAscendingDates(left.due_at, right.due_at));
}

export function getRecentFeedback(assignments: StudentAssignmentSummary[]) {
  return assignments
    .filter((assignment) => assignment.studentStatus === "reviewed")
    .sort((left, right) => compareDescendingDates(left.submission?.reviewed_at, right.submission?.reviewed_at));
}

export function getProgressMetrics(snapshot: StudentPortalSnapshot) {
  const completedLessons = snapshot.enrollments.reduce((sum, enrollment) => sum + enrollment.completedLessons, 0);
  const completedCourses = snapshot.enrollments.filter(
    (enrollment) => enrollment.status === "completed" || enrollment.completed_at,
  ).length;
  const submittedAssignments = snapshot.assignments.filter((assignment) => assignment.submission && assignment.submission.status !== "draft").length;

  return {
    completedLessons,
    completedCourses,
    submittedAssignments,
    certificates: 0,
  };
}
