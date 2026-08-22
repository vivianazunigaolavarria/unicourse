import { CourseProgressCard } from "@/components/student/course-progress-card";
import { DashboardEmptyState } from "@/components/student/dashboard-empty-state";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getVisibleEnrollments } from "@/lib/student-dashboard";

export default async function StudentCoursesPage() {
  const viewer = await requireAuthenticatedViewer("/mis-cursos");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const visibleEnrollments = getVisibleEnrollments(snapshot.enrollments);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Mis cursos"
        title="Tu espacio de estudio"
        description="Aquí reunimos todos los cursos a los que ya tienes acceso para que avances con claridad y sin perder contexto."
        firstName={viewer.first_name}
      />

      {visibleEnrollments.length === 0 ? (
        <DashboardEmptyState
          title="Todavía no tienes cursos activos."
          description="Cuando se abra tu primera inscripción, verás aquí tu progreso, tus módulos y el acceso para continuar."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleEnrollments.map((enrollment) => (
            <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}
