import Link from "next/link";

import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDateTime } from "@/lib/labels";
import { getAdminDashboardSummary, getAdminLiveClassSnapshot, listSubmissions } from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [summary, liveClasses, submissions] = await Promise.all([
    getAdminDashboardSummary(),
    getAdminLiveClassSnapshot(4),
    listSubmissions({ page: 1, pageSize: 4 }),
  ]);

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex items-start">
          <div className="inline-flex max-w-full rounded-full border border-[var(--uc-border)] bg-[linear-gradient(135deg,rgba(122,94,255,0.16),rgba(122,94,255,0.08))] px-8 py-5 shadow-[0_18px_45px_rgba(122,94,255,0.08)]">
            <h1 className="font-heading text-4xl leading-none text-[var(--uc-accent)] sm:text-5xl">Resumen operativo</h1>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Nuevas cuentas</p>
            <p className="mt-3 font-heading text-4xl">{summary.newAccountsCount}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">Últimos 30 días</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Próximas sesiones</p>
            <p className="mt-3 font-heading text-4xl">{summary.upcomingLiveClassCount}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">Publicadas y futuras</p>
          </div>
        </div>
      </SectionCard>

      <div className="uc-grid-auto">
        <SectionCard className="grid gap-3">
          <StatusChip tone="violet">Alumnas</StatusChip>
          <h2 className="font-heading text-3xl">{summary.studentCount}</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Perfiles estudiantiles disponibles para seguimiento, soporte y tagging.</p>
        </SectionCard>
        <SectionCard className="grid gap-3">
          <StatusChip tone="teal">Cursos activos</StatusChip>
          <h2 className="font-heading text-3xl">{summary.activeCourseCount}</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Cursos publicados con posibilidad de matrícula y acceso controlado.</p>
        </SectionCard>
        <SectionCard className="grid gap-3">
          <StatusChip tone="amber">Revisión</StatusChip>
          <h2 className="font-heading text-3xl">{summary.pendingSubmissionCount}</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Entregas esperando revisión administrativa o académica.</p>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="uc-kicker">Clases en vivo</p>
              <h2 className="mt-2 font-heading text-3xl">Próximas sesiones</h2>
            </div>
            <Link className="uc-button-secondary" href="/admin/sesiones-en-vivo">
              Ver agenda
            </Link>
          </div>

          <div className="grid gap-3">
            {liveClasses.classes.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--uc-border)] p-4 text-[15px] leading-7 text-[var(--uc-muted)]">
                Todavía no hay sesiones publicadas en la agenda. Cuando se programen, aparecerán aquí con fecha, curso, instructora y acceso.
              </div>
            ) : (
              liveClasses.classes.map((liveClass) => (
                <div key={liveClass.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone={liveClass.meeting_url ? "teal" : "amber"}>
                      {liveClass.meeting_url ? "Meet listo" : "Link pendiente"}
                    </StatusChip>
                    <span className="text-sm text-[var(--uc-muted)]">{liveClass.course?.title ?? "Curso"}</span>
                  </div>
                  <h3 className="mt-3 font-heading text-2xl">{liveClass.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                    {formatDateTime(liveClass.starts_at)} · {liveClass.instructor_name}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="uc-kicker">Cola de entregas</p>
              <h2 className="mt-2 font-heading text-3xl">Actividad reciente</h2>
            </div>
            <Link className="uc-button-secondary" href="/admin/entregas">
              Ver entregas
            </Link>
          </div>

          <div className="grid gap-3">
            {submissions.submissions.map((submission) => (
              <div key={submission.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={submission.status === "submitted" ? "amber" : "teal"}>
                    {submission.status === "submitted" ? "Pendiente" : "Revisada"}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">{submission.course?.title ?? "Curso"}</span>
                </div>
                <h3 className="mt-3 font-heading text-2xl">{submission.assignment?.title ?? "Entrega sin título"}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">
                  {submission.student ? `${submission.student.first_name} ${submission.student.last_name}` : "Alumna"} ·{" "}
                  {formatDateTime(submission.submitted_at ?? submission.created_at)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
