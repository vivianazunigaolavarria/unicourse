import { studentNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SessionRail } from "@/components/layout/session-rail";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { formatDateTime } from "@/lib/labels";

export default async function StudentClassesPage() {
  const viewer = await requireAuthenticatedViewer("/mis-clases");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const nextClass = snapshot.liveClasses[0] ?? null;

  return (
    <AppShell
      badge="Portal de alumna"
      title="Mis clases"
      description="Próximas sesiones con horario visible, profesora clara y acceso simple."
      navItems={studentNavigation}
      rightRail={
        <SessionRail
          viewer={viewer}
          variant="student"
          highlight={
            nextClass
              ? {
                  label: "Siguiente sesión",
                  value: `${nextClass.title} · ${formatDateTime(nextClass.starts_at)}`,
                }
              : {
                  label: "Agenda",
                  value: "Aún no hay clases en vivo publicadas para tus cursos.",
                }
          }
        />
      }
    >
      <SectionCard className="grid gap-4 rounded-[34px] p-8">
        <StatusChip tone="teal">Clases en vivo</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Entrar a tu sesión debe sentirse obvio, no técnico.</h1>
      </SectionCard>

      {snapshot.liveClasses.length === 0 ? (
        <EmptyState
          title="No hay clases agendadas todavía"
          description="En cuanto se publique una sesión para tus cursos, aparecerá aquí con el horario y el enlace correspondiente."
        />
      ) : (
        <div className="grid gap-4">
          {snapshot.liveClasses.map((item) => (
            <SectionCard key={item.id} className="grid gap-3">
              <StatusChip tone="teal">Clase programada</StatusChip>
              <h2 className="font-heading text-3xl">{item.title}</h2>
              <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
                {formatDateTime(item.starts_at)} · {item.course?.title ?? "Curso"}
              </p>
              <p className="text-sm text-[var(--uc-muted)]">Profesora: {item.instructor_name}</p>
              {item.meeting_url ? (
                <a className="uc-button-primary justify-center sm:justify-start" href={item.meeting_url} rel="noreferrer" target="_blank">
                  Entrar a la clase
                </a>
              ) : (
                <button className="uc-button-primary justify-center sm:justify-start" disabled type="button">
                  Enlace pendiente
                </button>
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
