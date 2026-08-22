import { CalendarDays, Clock3, Video } from "lucide-react";

import { DashboardEmptyState } from "@/components/student/dashboard-empty-state";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { formatDateTime } from "@/lib/labels";
import { getUpcomingLiveClasses } from "@/lib/student-dashboard";

export default async function StudentClassesPage() {
  const viewer = await requireAuthenticatedViewer("/mis-clases");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const liveClasses = getUpcomingLiveClasses(snapshot.liveClasses);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Clases en vivo"
        title="Tus próximas sesiones"
        description="Este espacio está listo para concentrar las clases en vivo impartidas por profesionales de la industria."
        firstName={viewer.first_name}
      />

      {liveClasses.length === 0 ? (
        <DashboardEmptyState
          title="No tienes clases en vivo programadas por ahora."
          description="Cuando se confirme la siguiente sesión, verás aquí la fecha, la hora, la instructora y el acceso correspondiente."
        />
      ) : (
        <div className="grid gap-4">
          {liveClasses.map((liveClass) => (
            <SectionCard key={liveClass.id} className="grid gap-4 rounded-[28px] p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]">
                    <Video className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="uc-kicker">Clase programada</p>
                    <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">{liveClass.title}</h2>
                  </div>
                </div>

                <p className="text-base leading-7 text-[var(--uc-muted)]">
                  {liveClass.course?.title ?? "UniCourse"} con {liveClass.instructor_name}
                </p>

                <div className="flex flex-wrap gap-5 text-sm text-[var(--uc-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[var(--uc-violet)]" />
                    {formatDateTime(liveClass.starts_at)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[var(--uc-violet)]" />
                    {liveClass.duration_minutes} minutos
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {liveClass.canJoin && liveClass.meeting_url ? (
                  <a className="uc-button-primary" href={liveClass.meeting_url} rel="noreferrer" target="_blank">
                    Entrar a la clase
                  </a>
                ) : (
                  <span className="rounded-full border border-[var(--uc-border)] bg-white/72 px-4 py-3 text-sm text-[var(--uc-muted)]">
                    El acceso se habilita cerca de la hora de inicio.
                  </span>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
