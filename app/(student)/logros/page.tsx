import { AchievementSummary } from "@/components/student/achievement-summary";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { ProgressSummary } from "@/components/student/progress-summary";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getProgressMetrics } from "@/lib/student-dashboard";

export default async function StudentAchievementsPage() {
  const viewer = await requireAuthenticatedViewer("/logros");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const progress = getProgressMetrics(snapshot);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Logros"
        title="Tus hitos dentro de UniCourse"
        description="Este espacio resume tu progreso real y queda listo para certificados, cierres de curso y reconocimientos futuros."
        firstName={viewer.first_name}
      />

      <ProgressSummary {...progress} />
      <AchievementSummary {...progress} />
    </div>
  );
}
