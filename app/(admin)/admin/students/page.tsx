import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDate, formatDateTime, formatEnrollmentStatusLabel, formatProgressLabel } from "@/lib/labels";
import { getAdminCountryOptions, getAdminCourseOptions, listStudents } from "@/lib/data/admin";
import { readPositiveInt, readSearchParam } from "@/lib/search-params";
import { withQuery } from "@/lib/urls";

type AdminStudentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminStudentsPage({ searchParams }: AdminStudentsPageProps) {
  const params = (await searchParams) ?? {};
  const q = readSearchParam(params.q) ?? "";
  const courseId = readSearchParam(params.courseId) ?? "";
  const enrollmentStatus = readSearchParam(params.enrollmentStatus) ?? "";
  const country = readSearchParam(params.country) ?? "";
  const page = readPositiveInt(params.page, 1);

  const [directory, courses, countries] = await Promise.all([
    listStudents({
      q,
      courseId: courseId || undefined,
      enrollmentStatus: enrollmentStatus || undefined,
      country: country || undefined,
      page,
      pageSize: 10,
    }),
    getAdminCourseOptions(),
    getAdminCountryOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(directory.totalCount / directory.pageSize));

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">Directorio de alumnas</StatusChip>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="grid gap-3">
            <h1 className="font-heading text-5xl leading-tight">Busca por nombre, correo, país o estado de inscripción.</h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
              El filtro corre del lado del servidor para que este directorio siga siendo útil aunque la base crezca.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--uc-border)] p-5">
            <p className="uc-kicker">Resultados</p>
            <p className="mt-3 font-heading text-5xl">{directory.totalCount}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">Página {directory.page} de {totalPages}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Buscar
            <input className="uc-input" defaultValue={q} name="q" placeholder="Nombre o correo" type="search" />
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
            <select className="uc-input" defaultValue={enrollmentStatus} name="enrollmentStatus">
              <option value="">Todos</option>
              <option value="active">Activa</option>
              <option value="paused">En pausa</option>
              <option value="completed">Completada</option>
              <option value="suspended">Suspendida</option>
              <option value="revoked">Revocada</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            País
            <select className="uc-input" defaultValue={country} name="country">
              <option value="">Todos</option>
              {countries.map((countryOption) => (
                <option key={countryOption} value={countryOption}>
                  {countryOption}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button className="uc-button-primary w-full justify-center" type="submit">
              Filtrar
            </button>
          </div>
        </form>
      </SectionCard>

      {directory.students.length === 0 ? (
        <EmptyState
          title="No encontramos alumnas con esos filtros"
          description="Prueba ajustando el nombre, el curso o el estado de inscripción para ampliar la búsqueda."
        />
      ) : (
        <div className="grid gap-4">
          {directory.students.map((student) => (
            <SectionCard key={student.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={student.progressPercentage >= 70 ? "teal" : student.progressPercentage >= 40 ? "violet" : "amber"}>
                    {student.progressPercentage >= 70 ? "Avanzando bien" : student.progressPercentage >= 40 ? "Seguimiento" : "Atención"}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">{student.email}</span>
                </div>
                <div>
                  <h2 className="font-heading text-3xl">
                    {student.display_name?.trim() || `${student.first_name} ${student.last_name}`}
                  </h2>
                  <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                    {student.country ?? "País no capturado"} · Creó su cuenta el {formatDate(student.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-[var(--uc-muted)]">
                  <span>{student.courseCount} cursos</span>
                  <span>·</span>
                  <span>Última actividad: {formatDateTime(student.lastActivityAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {student.enrollments.slice(0, 3).map((enrollment) => (
                    <StatusChip key={enrollment.id} tone={enrollment.status === "active" ? "teal" : enrollment.status === "completed" ? "violet" : "amber"}>
                      {`${enrollment.courses?.title ?? "Curso"} · ${formatEnrollmentStatusLabel(enrollment.status)}`}
                    </StatusChip>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(107,92,224,0.06)] p-5">
                <div>
                  <p className="uc-kicker">Progreso general</p>
                  <p className="mt-3 font-heading text-4xl">{formatProgressLabel(student.progressPercentage)}</p>
                </div>
                <Link className="uc-button-primary justify-center" href={`/admin/students/${student.id}`}>
                  Ver perfil
                </Link>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--uc-muted)]">
          Mostrando página {directory.page} de {totalPages}.
        </p>
        <div className="flex gap-3">
          <Link
            aria-disabled={directory.page <= 1}
            className="uc-button-secondary"
            href={withQuery("/admin/students", {
              q,
              courseId,
              enrollmentStatus,
              country,
              page: directory.page > 1 ? String(directory.page - 1) : "1",
            })}
          >
            Anterior
          </Link>
          <Link
            aria-disabled={directory.page >= totalPages}
            className="uc-button-primary"
            href={withQuery("/admin/students", {
              q,
              courseId,
              enrollmentStatus,
              country,
              page: directory.page < totalPages ? String(directory.page + 1) : String(totalPages),
            })}
          >
            Siguiente
          </Link>
        </div>
      </SectionCard>
    </>
  );
}
