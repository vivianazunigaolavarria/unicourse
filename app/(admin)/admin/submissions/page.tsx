import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminCourseOptions, listSubmissions } from "@/lib/data/admin";
import { formatDateTime, formatSubmissionStatusLabel } from "@/lib/labels";
import { readPositiveInt, readSearchParam } from "@/lib/search-params";
import { withQuery } from "@/lib/urls";
import Link from "next/link";

type AdminSubmissionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSubmissionsPage({ searchParams }: AdminSubmissionsPageProps) {
  const params = (await searchParams) ?? {};
  const q = readSearchParam(params.q) ?? "";
  const courseId = readSearchParam(params.courseId) ?? "";
  const reviewStatus = readSearchParam(params.reviewStatus) ?? "";
  const page = readPositiveInt(params.page, 1);

  const [courses, results] = await Promise.all([
    getAdminCourseOptions(),
    listSubmissions({
      q: q || undefined,
      courseId: courseId || undefined,
      reviewStatus: reviewStatus || undefined,
      page,
      pageSize: 10,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(results.totalCount / results.pageSize));

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="amber">Entregas y revisiones</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Una cola clara para revisar entregas sin perder el contexto de cada alumna.</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
          Puedes filtrar por alumna, curso o estado de revisión y ver el detalle básico sin cargar toda la base al navegador.
        </p>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_240px_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Buscar
            <input className="uc-input" defaultValue={q} name="q" placeholder="Nombre o correo de la alumna" type="search" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Curso
            <select className="uc-input" defaultValue={courseId} name="courseId">
              <option value="">Todos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Estado
            <select className="uc-input" defaultValue={reviewStatus} name="reviewStatus">
              <option value="">Todos</option>
              <option value="submitted">Pendiente</option>
              <option value="reviewed">Revisada</option>
              <option value="changes_requested">Pide cambios</option>
              <option value="approved">Aprobada</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="uc-button-primary w-full justify-center" type="submit">
              Filtrar
            </button>
          </div>
        </form>
      </SectionCard>

      {results.submissions.length === 0 ? (
        <EmptyState
          title="No hay entregas con esos filtros"
          description="Prueba cambiando el curso o el estado de revisión para ver más actividad."
        />
      ) : (
        <div className="grid gap-4">
          {results.submissions.map((submission) => (
            <SectionCard key={submission.id} className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={submission.status === "submitted" ? "amber" : submission.status === "approved" ? "teal" : "violet"}>
                  {formatSubmissionStatusLabel(submission.status)}
                </StatusChip>
                <span className="text-sm text-[var(--uc-muted)]">{submission.course?.title ?? "Curso sin dato"}</span>
              </div>
              <div>
                <h2 className="font-heading text-3xl">{submission.assignment?.title ?? "Entrega sin título"}</h2>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                  {submission.student
                    ? `${submission.student.first_name} ${submission.student.last_name} · ${submission.student.email}`
                    : "Alumna sin dato"}
                </p>
              </div>
              <p className="text-sm text-[var(--uc-muted)]">
                Enviada: {formatDateTime(submission.submitted_at ?? submission.created_at)}
                {submission.is_late ? " · Entrega tardía" : ""}
              </p>
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--uc-muted)]">
          Página {results.page} de {totalPages}
        </p>
        <div className="flex gap-3">
          <Link className="uc-button-secondary" href={withQuery("/admin/entregas", { q, courseId, reviewStatus, page: String(Math.max(1, results.page - 1)) })}>
            Anterior
          </Link>
          <Link className="uc-button-primary" href={withQuery("/admin/entregas", { q, courseId, reviewStatus, page: String(Math.min(totalPages, results.page + 1)) })}>
            Siguiente
          </Link>
        </div>
      </SectionCard>
    </>
  );
}
