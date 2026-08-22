import Link from "next/link";

import { studentNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SessionRail } from "@/components/layout/session-rail";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { formatDateTime, formatProgressLabel, formatSubmissionStatusLabel } from "@/lib/labels";

export default async function StudentCoursesPage() {
  const viewer = await requireAuthenticatedViewer("/mis-cursos");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const averageProgress =
    snapshot.enrollments.length === 0
      ? 0
      : Math.round(
          snapshot.enrollments.reduce((sum, enrollment) => sum + enrollment.progressPercentage, 0) /
            snapshot.enrollments.length,
        );
  const nextLiveClass = snapshot.liveClasses[0] ?? null;

  return (
    <AppShell
      badge="Portal de alumna"
      title="Mis cursos"
      description="Lo que sigue, lo que ya avanzaste y lo que necesita tu atención, todo en un solo lugar."
      navItems={studentNavigation}
      rightRail={
        <SessionRail
          viewer={viewer}
          variant="student"
          highlight={
            nextLiveClass
              ? {
                  label: "Próxima clase",
                  value: `${nextLiveClass.title} · ${formatDateTime(nextLiveClass.starts_at)}`,
                }
              : {
                  label: "Tu acceso",
                  value: "Cuando se publique una clase o se habilite un curso, lo verás aquí.",
                }
          }
        />
      }
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">Continúa donde te quedaste</StatusChip>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="grid gap-4">
            <h1 className="font-heading text-5xl leading-tight">Tu aprendizaje ya está organizado para que sepas qué sigue.</h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
              Este portal toma tus cursos, tus tareas y tus clases en vivo directamente desde Supabase.
            </p>
          </div>
          <div className="rounded-[26px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(107,92,224,0.12),rgba(255,255,255,0.98))] p-5">
            <p className="uc-kicker">Progreso general</p>
            <p className="mt-3 font-heading text-5xl">{formatProgressLabel(averageProgress)}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--uc-muted)]">
              {snapshot.enrollments.length > 0
                ? `${snapshot.enrollments.length} curso(s) con acceso activo o historial.`
                : "Tu panel se activará en cuanto el equipo te asigne un curso."}
            </p>
          </div>
        </div>
      </SectionCard>

      {snapshot.enrollments.length === 0 ? (
        <EmptyState
          title="Todavía no tienes cursos asignados"
          description="Cuando administración te otorgue acceso, aquí aparecerán tus cursos, tus clases y tus próximas tareas."
          action={
            <Link className="uc-button-primary" href="/">
              Volver al inicio
            </Link>
          }
        />
      ) : (
        <div className="uc-grid-auto">
          {snapshot.enrollments.map((enrollment) => (
            <SectionCard key={enrollment.id} className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={enrollment.access_state === "enabled" ? "teal" : "amber"}>
                  {enrollment.access_state === "enabled" ? "Con acceso" : "Acceso pausado"}
                </StatusChip>
                <span className="text-sm text-[var(--uc-muted)]">{enrollment.cohorts?.name ?? "Sin cohorte"}</span>
              </div>
              <h2 className="font-heading text-3xl">{enrollment.courses?.title ?? "Curso"}</h2>
              <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
                {enrollment.completedLessons} de {enrollment.totalLessons} lecciones completadas.
              </p>
              <div className="overflow-hidden rounded-full bg-[rgba(107,92,224,0.10)]">
                <div
                  className="h-3 rounded-full bg-[linear-gradient(90deg,var(--uc-violet),var(--uc-teal))]"
                  style={{ width: `${enrollment.progressPercentage}%` }}
                />
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-3xl">Mis tareas</h2>
            <StatusChip tone="amber">
              {`${snapshot.assignments.filter((assignment) => !assignment.submission || assignment.submission.status === "draft").length} pendientes`}
            </StatusChip>
          </div>
          <div className="grid gap-3">
            {snapshot.assignments.slice(0, 4).map((assignment) => {
              const status = assignment.submission?.status ?? "draft";

              return (
                <div key={assignment.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone={status === "approved" ? "teal" : status === "submitted" ? "amber" : "violet"}>
                      {status === "draft" ? "Pendiente" : formatSubmissionStatusLabel(status)}
                    </StatusChip>
                    <span className="text-sm text-[var(--uc-muted)]">{assignment.course?.title ?? "Curso"}</span>
                  </div>
                  <h3 className="mt-3 font-heading text-2xl">{assignment.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                    Entrega sugerida: {formatDateTime(assignment.due_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-3xl">Mis clases</h2>
            <StatusChip tone="teal">Agenda clara</StatusChip>
          </div>
          <div className="grid gap-3">
            {snapshot.liveClasses.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <h3 className="font-heading text-2xl">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">{formatDateTime(item.starts_at)}</p>
                <p className="text-sm text-[var(--uc-muted)]">Profesora: {item.instructor_name}</p>
                {item.meeting_url ? (
                  <a className="uc-button-secondary mt-4" href={item.meeting_url} rel="noreferrer" target="_blank">
                    Entrar a la clase
                  </a>
                ) : (
                  <button className="uc-button-secondary mt-4" disabled type="button">
                    Enlace pendiente
                  </button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
