import Link from "next/link";

import { CourseProgressCard } from "@/components/student/course-progress-card";
import { DashboardEmptyState } from "@/components/student/dashboard-empty-state";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { LiveClassCard } from "@/components/student/live-class-card";
import { PendingAssignments } from "@/components/student/pending-assignments";
import { ProgressSummary } from "@/components/student/progress-summary";
import { RecentFeedback } from "@/components/student/recent-feedback";
import { RecommendedCourses } from "@/components/student/recommended-courses";
import { AchievementSummary } from "@/components/student/achievement-summary";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getNextLiveClass, getPendingAssignments, getProgressMetrics, getRecentFeedback, getVisibleEnrollments } from "@/lib/student-dashboard";

export default async function StudentDashboardPage() {
  const viewer = await requireAuthenticatedViewer("/dashboard");
  const snapshot = await getStudentPortalSnapshot(viewer.id);

  const visibleEnrollments = getVisibleEnrollments(snapshot.enrollments);
  const nextLiveClass = getNextLiveClass(snapshot.liveClasses);
  const pendingAssignments = getPendingAssignments(snapshot.assignments).slice(0, 4);
  const recentFeedback = getRecentFeedback(snapshot.assignments).slice(0, 3);
  const progress = getProgressMetrics(snapshot);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        title={`Hola, ${viewer.first_name}`}
        description="Qué bueno tenerte de vuelta. Retoma justo donde te quedaste y revisa tus próximos pasos desde un solo lugar."
        firstName={viewer.first_name}
      />

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <p className="uc-kicker">Cursos en progreso</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Lo que ya estás estudiando</h2>
          </div>

          <Link href="/mis-cursos" className="text-sm font-medium text-[var(--uc-violet)]">
            Ver todos
          </Link>
        </div>

        {visibleEnrollments.length === 0 ? (
          <DashboardEmptyState
            title="Todavía no estás inscrita en ningún curso."
            description="Cuando comiences tu primer curso, aparecerá aquí junto con tu avance, tus módulos y el botón para continuar."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {visibleEnrollments.slice(0, 3).map((enrollment) => (
              <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {nextLiveClass ? (
          <LiveClassCard liveClass={nextLiveClass} />
        ) : (
          <DashboardEmptyState
            title="No tienes clases en vivo programadas por ahora."
            description="Cuando tu próxima sesión con expertas quede agendada, la verás aquí con fecha, hora y acceso."
          />
        )}

        <ProgressSummary {...progress} />
      </div>

      <PendingAssignments assignments={pendingAssignments} />
      <RecentFeedback items={recentFeedback} />
      <AchievementSummary {...progress} />
      <RecommendedCourses courses={snapshot.recommendedCourses} />
    </div>
  );
}
