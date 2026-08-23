import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { TagChip } from "@/components/ui/tag-chip";
import { getAdminCountryOptions, getAdminCourseOptions, getAdminRegionOptions, getAdminTagOptions, listAdminProfiles } from "@/lib/data/admin";
import {
  ageRangeOptions,
  formatAccountStatusLabel,
  formatAgeRangeLabel,
  formatDate,
  formatOccupationValue,
  formatRoleLabel,
} from "@/lib/labels";
import { readPositiveInt, readSearchParam } from "@/lib/search-params";
import { withQuery } from "@/lib/urls";

type AdminStudentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const roleOptions = [
  { value: "", label: "Todos los roles" },
  { value: "student", label: "Alumna" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
  { value: "instructor", label: "Instructora" },
];

const accountStatusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "active", label: "Activa" },
  { value: "invited", label: "Pendiente" },
  { value: "suspended", label: "Suspendida" },
  { value: "archived", label: "Archivada" },
];

export default async function AdminStudentsPage({ searchParams }: AdminStudentsPageProps) {
  const params = (await searchParams) ?? {};
  const q = readSearchParam(params.q) ?? "";
  const courseId = readSearchParam(params.courseId) ?? "";
  const country = readSearchParam(params.country) ?? "";
  const regionTagId = readSearchParam(params.regionTagId) ?? "";
  const ageRange = readSearchParam(params.ageRange) ?? "";
  const role = readSearchParam(params.role) ?? "";
  const accountStatus = readSearchParam(params.accountStatus) ?? "";
  const tagId = readSearchParam(params.tagId) ?? "";
  const page = readPositiveInt(params.page, 1);

  const [directory, courses, countries, regionOptions, tagOptions] = await Promise.all([
    listAdminProfiles({
      q,
      courseId: courseId || undefined,
      country: country || undefined,
      regionTagId: regionTagId || undefined,
      ageRange: ageRange || undefined,
      role: role || undefined,
      accountStatus: accountStatus || undefined,
      tagId: tagId || undefined,
      page,
      pageSize: 10,
    }),
    getAdminCourseOptions(),
    getAdminCountryOptions(),
    getAdminRegionOptions(),
    getAdminTagOptions(),
  ]);

  const manualAndGeneralTags = tagOptions.filter((tag) => tag.category !== "region");
  const totalPages = Math.max(1, Math.ceil(directory.totalCount / directory.pageSize));
  const paginationParams = {
    q,
    courseId,
    country,
    regionTagId,
    ageRange,
    role,
    accountStatus,
    tagId,
  };

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">Base administrativa</StatusChip>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="grid gap-3">
            <h1 className="font-heading text-5xl leading-tight">Base de alumnas y cuentas con filtros reales del lado del servidor.</h1>
            <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
              Busca por nombre, apellido o correo y combina país, región, rango de edad, rol, estado, curso y tags
              sin cargar toda la base al navegador.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--uc-border)] p-5">
            <p className="uc-kicker">Resultados visibles</p>
            <p className="mt-3 font-heading text-5xl">{directory.totalCount}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">Página {directory.page} de {totalPages}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <form className="grid gap-4 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)] xl:col-span-2">
            Buscar
            <input className="uc-input" defaultValue={q} name="q" placeholder="Nombre, apellido o correo" type="search" />
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

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Región
            <select className="uc-input" defaultValue={regionTagId} name="regionTagId">
              <option value="">Todas</option>
              {regionOptions.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Rango de edad
            <select className="uc-input" defaultValue={ageRange} name="ageRange">
              <option value="">Todos</option>
              {ageRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Rol
            <select className="uc-input" defaultValue={role} name="role">
              {roleOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Estado
            <select className="uc-input" defaultValue={accountStatus} name="accountStatus">
              {accountStatusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)] xl:col-span-2">
            Tag
            <select className="uc-input" defaultValue={tagId} name="tagId">
              <option value="">Todos</option>
              {manualAndGeneralTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.category ? `${tag.name} · ${tag.category}` : tag.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end xl:col-span-2">
            <button className="uc-button-primary w-full justify-center" type="submit">
              Aplicar filtros
            </button>
          </div>
        </form>
      </SectionCard>

      {directory.profiles.length === 0 ? (
        <EmptyState
          title="No encontramos perfiles con esos filtros"
          description="Prueba ampliando la búsqueda o quitando algunos filtros para ver más resultados."
        />
      ) : (
        <div className="grid gap-4">
          {directory.profiles.map((profile) => (
            <SectionCard key={profile.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={profile.role === "super_admin" ? "violet" : profile.role === "admin" ? "teal" : "amber"}>
                    {formatRoleLabel(profile.role as "student" | "admin" | "super_admin" | "instructor")}
                  </StatusChip>
                  <StatusChip tone={profile.account_status === "active" ? "teal" : profile.account_status === "suspended" ? "amber" : "violet"}>
                    {formatAccountStatusLabel(profile.account_status)}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">{profile.email}</span>
                </div>

                <div>
                  <h2 className="font-heading text-3xl">
                    {profile.display_name?.trim() || `${profile.first_name} ${profile.last_name}`.trim()}
                  </h2>
                  <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                    {profile.country ?? "País no capturado"} · Registro: {formatDate(profile.created_at)}
                  </p>
                </div>

                <div className="grid gap-2 text-sm leading-6 text-[var(--uc-muted)] md:grid-cols-2">
                  <p>Edad: {formatAgeRangeLabel(profile.age_range)}</p>
                  <p>Ocupación: {formatOccupationValue(profile.occupation)}</p>
                  <p>Cursos inscritos: {profile.courseCount}</p>
                  <p>Fecha de nacimiento: {profile.date_of_birth ? formatDate(profile.date_of_birth) : "Sin dato"}</p>
                </div>

                {profile.enrollments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.enrollments.slice(0, 3).map((enrollment) => (
                      <TagChip key={enrollment.id} label={enrollment.title} source="automatic" />
                    ))}
                    {profile.enrollments.length > 3 ? <TagChip label={`+${profile.enrollments.length - 3} más`} source="automatic" /> : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {profile.tags.length > 0 ? (
                    profile.tags.map((tag) => (
                      <TagChip key={`${profile.id}-${tag.id}`} color={tag.color} label={tag.name} source={tag.source} />
                    ))
                  ) : (
                    <span className="text-sm text-[var(--uc-muted)]">Sin tags asignados todavía.</span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(107,92,224,0.06)] p-5">
                <div>
                  <p className="uc-kicker">Ficha administrativa</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--uc-muted)]">
                    Revisa sus datos, tags, cursos, tareas y el estado general de la cuenta.
                  </p>
                </div>
                <Link className="uc-button-primary justify-center" href={`/admin/alumnas/${profile.id}`}>
                  Ver perfil completo
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
            href={withQuery("/admin/alumnas", {
              ...paginationParams,
              page: directory.page > 1 ? String(directory.page - 1) : "1",
            })}
          >
            Anterior
          </Link>
          <Link
            aria-disabled={directory.page >= totalPages}
            className="uc-button-primary"
            href={withQuery("/admin/alumnas", {
              ...paginationParams,
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
