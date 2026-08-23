import Link from "next/link";

import { NoticeBanner } from "@/components/ui/notice-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { listCourses } from "@/lib/data/admin";
import { formatDifficultyLabel, formatPublicationStatusLabel } from "@/lib/labels";
import { readPositiveInt, readSearchParam } from "@/lib/search-params";
import { withQuery } from "@/lib/urls";

type AdminCoursesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const courseNoticeMessages: Record<string, { title: string; description: string; tone: "info" | "success" | "error" }> = {
  "course-created": {
    title: "Curso creado",
    description: "El curso ya quedó registrado como borrador y listo para seguir construyéndose.",
    tone: "success",
  },
  "course-create-failed": {
    title: "No pudimos crear el curso",
    description: "Revisa el título, el slug y que no exista otro curso con la misma URL interna.",
    tone: "error",
  },
};

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const params = (await searchParams) ?? {};
  const q = readSearchParam(params.q) ?? "";
  const status = readSearchParam(params.status) ?? "";
  const page = readPositiveInt(params.page, 1);
  const noticeCode = readSearchParam(params.notice);
  const pageNotice = noticeCode ? courseNoticeMessages[noticeCode] ?? null : null;

  const results = await listCourses({ q: q || undefined, status: status || undefined, page, pageSize: 8 });
  const totalPages = Math.max(1, Math.ceil(results.totalCount / results.pageSize));

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-3">
            <StatusChip tone="violet">Gestión de cursos</StatusChip>
            <h1 className="font-heading text-5xl leading-tight">Cursos reales, listos para crecer sobre el schema actual.</h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
              Aquí ya no hay fixtures: ves cursos guardados en Supabase y puedes abrir nuevos borradores desde el panel.
            </p>
          </div>
          <Link className="uc-button-primary" href="/admin/cursos/nuevo">
            Crear curso
          </Link>
        </div>
        {pageNotice ? <NoticeBanner {...pageNotice} /> : null}
      </SectionCard>

      <SectionCard className="grid gap-4">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Buscar
            <input className="uc-input" defaultValue={q} name="q" placeholder="Título o slug" type="search" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Estado
            <select className="uc-input" defaultValue={status} name="status">
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="uc-button-secondary w-full justify-center" type="submit">
              Filtrar
            </button>
          </div>
        </form>
      </SectionCard>

      {results.courses.length === 0 ? (
        <EmptyState
          title="Todavía no hay cursos con esos filtros"
          description="Crea un nuevo curso o amplia la búsqueda para ver más resultados."
          action={
            <Link className="uc-button-primary" href="/admin/cursos/nuevo">
              Crear curso
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {results.courses.map((course) => (
            <SectionCard key={course.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={course.status === "published" ? "teal" : course.status === "archived" ? "amber" : "violet"}>
                    {formatPublicationStatusLabel(course.status)}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">{formatDifficultyLabel(course.difficulty)}</span>
                </div>
                <div>
                  <h2 className="font-heading text-3xl">{course.title}</h2>
                  <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                    {course.short_description || "Sin descripción corta todavía."}
                  </p>
                </div>
                <p className="text-sm text-[var(--uc-muted)]">Slug: /{course.slug}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.08)] p-5">
                <p className="uc-kicker">Accesos activos</p>
                <p className="mt-3 font-heading text-4xl">{course.enrolledStudentsCount}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--uc-muted)]">
          Página {results.page} de {totalPages}
        </p>
        <div className="flex gap-3">
          <Link className="uc-button-secondary" href={withQuery("/admin/cursos", { q, status, page: String(Math.max(1, results.page - 1)) })}>
            Anterior
          </Link>
          <Link className="uc-button-primary" href={withQuery("/admin/cursos", { q, status, page: String(Math.min(totalPages, results.page + 1)) })}>
            Siguiente
          </Link>
        </div>
      </SectionCard>
    </>
  );
}
