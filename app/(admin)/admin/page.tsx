import Link from "next/link";

import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDateTime } from "@/lib/labels";
import { getAdminDashboardSummary, listCourses, listSubmissions } from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [summary, courses, submissions] = await Promise.all([
    getAdminDashboardSummary(),
    listCourses({ page: 1, pageSize: 4 }),
    listSubmissions({ page: 1, pageSize: 4 }),
  ]);

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="grid gap-4">
          <StatusChip tone="violet">Resumen operativo</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Todo lo importante del programa en una sola vista.</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Este panel ya usa datos reales de Supabase para contar alumnas, cursos, entregas
            pendientes y cuentas administrativas.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Entregas pendientes</p>
            <p className="mt-3 font-heading text-4xl">{summary.pendingSubmissionCount}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Admins activos</p>
            <p className="mt-3 font-heading text-4xl">{summary.adminCount}</p>
          </div>
        </div>
      </SectionCard>

      <div className="uc-grid-auto">
        <SectionCard className="grid gap-3">
          <StatusChip tone="violet">Alumnas</StatusChip>
          <h2 className="font-heading text-3xl">{summary.studentCount}</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Perfiles estudiantiles visibles para seguimiento y soporte.</p>
        </SectionCard>
        <SectionCard className="grid gap-3">
          <StatusChip tone="teal">Cursos</StatusChip>
          <h2 className="font-heading text-3xl">{summary.courseCount}</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Cursos listos para borrador, publicación y control de acceso.</p>
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
              <p className="uc-kicker">Cursos recientes</p>
              <h2 className="mt-2 font-heading text-3xl">Lo último creado</h2>
            </div>
            <Link className="uc-button-secondary" href="/admin/courses">
              Ver cursos
            </Link>
          </div>

          <div className="grid gap-3">
            {courses.courses.map((course) => (
              <div key={course.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={course.status === "published" ? "teal" : "amber"}>
                    {course.status === "published" ? "Publicado" : "Borrador"}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">{course.enrolledStudentsCount} alumnas</span>
                </div>
                <h3 className="mt-3 font-heading text-2xl">{course.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                  {course.short_description || "Sin descripción corta todavía."}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="uc-kicker">Cola de entregas</p>
              <h2 className="mt-2 font-heading text-3xl">Actividad reciente</h2>
            </div>
            <Link className="uc-button-secondary" href="/admin/submissions">
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
