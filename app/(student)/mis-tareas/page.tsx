import { studentNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SessionRail } from "@/components/layout/session-rail";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { formatDateTime, formatSubmissionStatusLabel } from "@/lib/labels";

export default async function StudentTasksPage() {
  const viewer = await requireAuthenticatedViewer("/mis-tareas");
  const snapshot = await getStudentPortalSnapshot(viewer.id);

  return (
    <AppShell
      badge="Portal de alumna"
      title="Mis tareas"
      description="Fechas claras, estado visible y el contexto mínimo necesario para saber qué sigue."
      navItems={studentNavigation}
      rightRail={
        <SessionRail
          viewer={viewer}
          variant="student"
          highlight={{
            label: "Entregas visibles",
            value: `${snapshot.assignments.length} tarea(s) disponible(s) para tu cuenta.`,
          }}
        />
      }
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="amber">Entrega clara y sin fricción</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Aquí verás exactamente qué tienes pendiente y qué ya fue revisado.</h1>
      </SectionCard>

      {snapshot.assignments.length === 0 ? (
        <EmptyState
          title="No tienes tareas publicadas todavía"
          description="Cuando tu curso publique una entrega, la verás aquí con su fecha y estado."
        />
      ) : (
        <div className="grid gap-4">
          {snapshot.assignments.map((assignment) => {
            const status = assignment.submission?.status ?? "draft";

            return (
              <SectionCard key={assignment.id} className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={status === "approved" ? "teal" : status === "submitted" ? "amber" : "violet"}>
                    {status === "draft" ? "Pendiente" : formatSubmissionStatusLabel(status)}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">
                    {assignment.course?.title ?? "Curso"} · Fecha: {formatDateTime(assignment.due_at)}
                  </span>
                </div>
                <h2 className="font-heading text-3xl">{assignment.title}</h2>
                <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
                  {assignment.submission?.submitted_at
                    ? `Último envío: ${formatDateTime(assignment.submission.submitted_at)}`
                    : "Todavía no registras un envío para esta tarea."}
                </p>
              </SectionCard>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
