import { DashboardHeader } from "@/components/student/dashboard-header";
import { PendingAssignments } from "@/components/student/pending-assignments";
import { RecentFeedback } from "@/components/student/recent-feedback";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getPendingAssignments, getRecentFeedback } from "@/lib/student-dashboard";

export default async function StudentTasksPage() {
  const viewer = await requireAuthenticatedViewer("/mis-tareas");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const pendingAssignments = getPendingAssignments(snapshot.assignments);
  const recentFeedback = getRecentFeedback(snapshot.assignments);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Mis tareas"
        title="Tus entregas y revisiones"
        description="Desde aquí podrás seguir lo pendiente, lo entregado y el feedback reciente sin mezclarlo con información ficticia."
        firstName={viewer.first_name}
      />

      <PendingAssignments assignments={pendingAssignments} />
      <RecentFeedback items={recentFeedback} />
    </div>
  );
}
