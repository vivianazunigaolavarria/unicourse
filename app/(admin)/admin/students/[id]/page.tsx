import Link from "next/link";
import { notFound } from "next/navigation";

import {
  assignTagAction,
  createTagAction,
  removeTagAction,
  renameTagAction,
  upsertStudentCourseAccessAction,
} from "@/app/(admin)/admin/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { TagChip } from "@/components/ui/tag-chip";
import {
  formatAccessStateLabel,
  formatAccountStatusLabel,
  formatAgeRangeLabel,
  formatDate,
  formatDateTime,
  formatEnrollmentStatusLabel,
  formatOccupationValue,
  formatProgressLabel,
  formatRoleLabel,
  formatSubmissionStatusLabel,
} from "@/lib/labels";
import { buildGoogleCalendarUrl, formatLiveClassDate, formatLiveClassTimeRange } from "@/lib/live-classes";
import { getStudentAdminDetail, getStudentEnrollmentOptions } from "@/lib/data/admin";
import { readSearchParam } from "@/lib/search-params";

type StudentAdminDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageMessages: Record<string, { title: string; description: string; tone: "info" | "success" | "error" }> = {
  "course-access-granted": {
    title: "Acceso otorgado",
    description: "La alumna ya tiene acceso al curso seleccionado.",
    tone: "success",
  },
  "course-access-revoked": {
    title: "Acceso revocado",
    description: "El acceso al curso quedó desactivado y se registró en auditoría.",
    tone: "success",
  },
  "course-access-failed": {
    title: "No pudimos actualizar el acceso",
    description: "Revisa si la alumna ya tiene un estado incompatible o si el curso sigue disponible.",
    tone: "error",
  },
  "tag-created": {
    title: "Tag creado",
    description: "El nuevo tag manual ya quedó disponible en la biblioteca administrativa.",
    tone: "success",
  },
  "tag-created-and-assigned": {
    title: "Tag creado y asignado",
    description: "El tag nuevo ya quedó unido a este perfil y disponible para futuros filtros.",
    tone: "success",
  },
  "tag-updated": {
    title: "Tag actualizado",
    description: "El nombre del tag manual ya quedó actualizado.",
    tone: "success",
  },
  "tag-assigned": {
    title: "Tag asignado",
    description: "La etiqueta manual ya quedó agregada a esta cuenta.",
    tone: "success",
  },
  "tag-removed": {
    title: "Tag removido",
    description: "La etiqueta manual ya no está asociada a este perfil.",
    tone: "success",
  },
  "tag-create-invalid": {
    title: "Faltan datos del tag",
    description: "Revisa el nombre y el color antes de guardar.",
    tone: "error",
  },
  "tag-create-failed": {
    title: "No pudimos crear el tag",
    description: "Puede que ya exista otro tag activo con ese nombre.",
    tone: "error",
  },
  "tag-update-invalid": {
    title: "No pudimos editar ese tag",
    description: "Solo los tags manuales pueden renombrarse desde esta vista.",
    tone: "error",
  },
  "tag-update-failed": {
    title: "No pudimos guardar el cambio",
    description: "Intenta nuevamente con un nombre distinto.",
    tone: "error",
  },
  "tag-assign-invalid": {
    title: "No pudimos asignar ese tag",
    description: "Selecciona un tag manual válido.",
    tone: "error",
  },
  "tag-assign-failed": {
    title: "No pudimos asignar el tag",
    description: "Revisa si ya estaba asignado o si hubo un conflicto en la base.",
    tone: "error",
  },
  "tag-remove-invalid": {
    title: "No pudimos quitar ese tag",
    description: "Los tags automáticos no se quitan manualmente porque dependen del perfil.",
    tone: "error",
  },
  "tag-remove-failed": {
    title: "No pudimos quitar el tag",
    description: "Intenta nuevamente en unos segundos.",
    tone: "error",
  },
};

function getDisplayName(profile: {
  display_name: string | null;
  first_name: string;
  last_name: string;
}) {
  return profile.display_name?.trim() || `${profile.first_name} ${profile.last_name}`.trim();
}

export default async function StudentAdminDetailPage({ params, searchParams }: StudentAdminDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const messageCode = readSearchParam(query?.notice) ?? readSearchParam(query?.error);
  const pageNotice = messageCode ? pageMessages[messageCode] ?? null : null;

  const [student, courseOptions] = await Promise.all([
    getStudentAdminDetail(id),
    getStudentEnrollmentOptions(id),
  ]);

  if (!student) {
    notFound();
  }

  const manualTags = student.tags.filter((tag) => tag.source === "manual");
  const automaticTags = student.tags.filter((tag) => tag.source === "automatic");
  const manualTagIds = new Set(manualTags.map((tag) => tag.id));
  const assignableManualTags = student.availableTags.filter((tag) => tag.source === "manual" && !manualTagIds.has(tag.id));
  const manualTagLibrary = student.availableTags.filter((tag) => tag.source === "manual");
  const regionLabel = automaticTags
    .filter((tag) => tag.category === "region")
    .map((tag) => tag.name)
    .join(" · ");
  const pendingSubmissions = student.submissions.filter((submission) => submission.status === "submitted").length;
  const reviewedSubmissions = student.submissions.filter((submission) => submission.status !== "submitted").length;
  const canonicalReturnTo = `/admin/alumnas/${student.profile.id}`;
  const isStudentRole = student.profile.role === "student";

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.15fr)_340px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={student.profile.role === "super_admin" ? "violet" : student.profile.role === "admin" ? "teal" : "amber"}>
              {formatRoleLabel(student.profile.role as "student" | "admin" | "super_admin" | "instructor")}
            </StatusChip>
            <StatusChip tone={student.profile.account_status === "active" ? "teal" : student.profile.account_status === "suspended" ? "amber" : "violet"}>
              {formatAccountStatusLabel(student.profile.account_status)}
            </StatusChip>
            <span className="text-sm text-[var(--uc-muted)]">Última actividad: {formatDateTime(student.lastActivityAt)}</span>
          </div>

          <div>
            <h1 className="font-heading text-5xl leading-tight">{getDisplayName(student.profile)}</h1>
            <p className="mt-3 text-lg leading-8 text-[var(--uc-muted)]">{student.profile.email}</p>
          </div>

          <div className="grid gap-2 text-[15px] leading-7 text-[var(--uc-muted)] md:grid-cols-2">
            <p>Nombre: {student.profile.first_name}</p>
            <p>Apellido: {student.profile.last_name}</p>
            <p>Fecha de nacimiento: {student.profile.date_of_birth ? formatDate(student.profile.date_of_birth) : "Sin dato"}</p>
            <p>Rango de edad: {formatAgeRangeLabel(student.profile.age_range)}</p>
            <p>Ocupación: {formatOccupationValue(student.profile.occupation)}</p>
            <p>País: {student.profile.country ?? "Sin dato"}</p>
            <p>Región: {regionLabel || "Sin dato"}</p>
            <p>Registro: {formatDate(student.profile.created_at)}</p>
            <p>Estado de cuenta: {formatAccountStatusLabel(student.profile.account_status)}</p>
            <p>Teléfono: {student.profile.phone ?? "Sin dato"}</p>
          </div>

          {pageNotice ? <NoticeBanner {...pageNotice} /> : null}
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Cursos inscritos</p>
            <p className="mt-3 font-heading text-4xl">{student.enrollments.length}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Tareas pendientes</p>
            <p className="mt-3 font-heading text-4xl">{pendingSubmissions}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Tareas revisadas</p>
            <p className="mt-3 font-heading text-4xl">{reviewedSubmissions}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="uc-kicker">Tags del perfil</p>
            <h2 className="mt-2 font-heading text-3xl">Segmentación manual y automática</h2>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] p-5">
              <p className="uc-kicker">Tags automáticos</p>
              <p className="text-sm leading-6 text-[var(--uc-muted)]">
                Se sincronizan desde fecha de nacimiento y país para mantener filtros consistentes en la base administrativa.
              </p>
              <div className="flex flex-wrap gap-2">
                {automaticTags.length > 0 ? (
                  automaticTags.map((tag) => (
                    <TagChip key={tag.id} color={tag.color} label={tag.name} source="automatic" />
                  ))
                ) : (
                  <span className="text-sm text-[var(--uc-muted)]">Todavía no hay tags automáticos derivados para esta cuenta.</span>
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] p-5">
              <p className="uc-kicker">Tags manuales asignados</p>
              <div className="flex flex-wrap gap-2">
                {manualTags.length > 0 ? (
                  manualTags.map((tag) => (
                    <form key={`${tag.id}-${student.profile.id}`} action={removeTagAction} className="inline-flex">
                      <input name="return_to" type="hidden" value={canonicalReturnTo} />
                      <input name="target_profile_id" type="hidden" value={student.profile.id} />
                      <input name="tag_id" type="hidden" value={tag.id} />
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(107,92,224,0.18)] bg-[rgba(107,92,224,0.08)] px-3 py-1 text-xs font-medium text-[var(--uc-violet)] transition hover:bg-[rgba(107,92,224,0.14)]"
                        type="submit"
                      >
                        <TagChip className="border-0 px-0 py-0" color={tag.color} label={tag.name} source="manual" />
                        <span>Quitar</span>
                      </button>
                    </form>
                  ))
                ) : (
                  <span className="text-sm text-[var(--uc-muted)]">Sin tags manuales todavía.</span>
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] p-5">
              <p className="uc-kicker">Biblioteca de tags manuales</p>
              {manualTagLibrary.length === 0 ? (
                <span className="text-sm text-[var(--uc-muted)]">Todavía no hay tags manuales creados.</span>
              ) : (
                <div className="grid gap-3">
                  {manualTagLibrary.map((tag) => (
                    <form key={tag.id} action={renameTagAction} className="grid gap-3 rounded-[18px] border border-[var(--uc-border)] p-4 lg:grid-cols-[minmax(0,1fr)_140px]">
                      <input name="return_to" type="hidden" value={canonicalReturnTo} />
                      <input name="tag_id" type="hidden" value={tag.id} />
                      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                        Nombre del tag
                        <input className="uc-input" defaultValue={tag.name} name="name" required type="text" />
                      </label>
                      <div className="flex items-end">
                        <button className="uc-button-secondary w-full justify-center" type="submit">
                          Renombrar
                        </button>
                      </div>
                    </form>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[var(--uc-border)] p-5">
              <p className="uc-kicker">Asignar tag existente</p>
              <form action={assignTagAction} className="mt-4 grid gap-4">
                <input name="return_to" type="hidden" value={canonicalReturnTo} />
                <input name="target_profile_id" type="hidden" value={student.profile.id} />
                <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                  Tag manual disponible
                  <select className="uc-input" name="tag_id" required>
                    <option value="">Selecciona un tag</option>
                    {assignableManualTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.category ? `${tag.name} · ${tag.category}` : tag.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="uc-button-primary justify-center" type="submit">
                  Asignar tag
                </button>
              </form>
            </div>

            <div className="rounded-[24px] border border-[var(--uc-border)] p-5">
              <p className="uc-kicker">Crear nuevo tag manual</p>
              <form action={createTagAction} className="mt-4 grid gap-4">
                <input name="return_to" type="hidden" value={canonicalReturnTo} />
                <input name="assign_to_profile_id" type="hidden" value={student.profile.id} />
                <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                  Nombre
                  <input className="uc-input" name="name" placeholder="cohorte-septiembre" required type="text" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                  Categoría
                  <input className="uc-input" name="category" placeholder="cohorte, curso, administración..." type="text" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                  Color
                  <input className="uc-input" defaultValue="#6b5ce0" name="color" placeholder="#6b5ce0" type="text" />
                </label>
                <button className="uc-button-primary justify-center" type="submit">
                  Crear y asignar
                </button>
              </form>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="uc-kicker">Cursos</p>
            <h2 className="mt-2 font-heading text-3xl">Inscripciones, progreso y acceso</h2>
          </div>
        </div>

        {isStudentRole ? (
          <>
            <form action={upsertStudentCourseAccessAction} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <input name="return_to" type="hidden" value={canonicalReturnTo} />
              <input name="target_student_profile_id" type="hidden" value={student.profile.id} />
              <input name="enable_access" type="hidden" value="true" />
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Curso disponible
                <select className="uc-input" name="target_course_id" required>
                  <option value="">Selecciona un curso</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <button className="uc-button-primary w-full justify-center" type="submit">
                  Otorgar acceso
                </button>
              </div>
            </form>

            {student.enrollments.length === 0 ? (
              <EmptyState
                title="Todavía no hay cursos inscritos"
                description="En cuanto esta alumna reciba acceso a un curso, el estado de enrollment aparecerá aquí."
              />
            ) : (
              <div className="grid gap-3">
                {student.enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="grid gap-4 rounded-[22px] border border-[var(--uc-border)] p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap gap-2">
                        <StatusChip tone={enrollment.access_state === "enabled" ? "teal" : "amber"}>
                          {formatAccessStateLabel(enrollment.access_state)}
                        </StatusChip>
                        <StatusChip tone={enrollment.status === "completed" ? "violet" : enrollment.status === "active" ? "teal" : "amber"}>
                          {formatEnrollmentStatusLabel(enrollment.status)}
                        </StatusChip>
                      </div>
                      <div>
                        <h3 className="font-heading text-2xl">{enrollment.courses?.title ?? "Curso sin título"}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">
                          Cohorte: {enrollment.cohorts?.name ?? "Sin cohorte"} · Inscrita el {formatDate(enrollment.enrolled_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--uc-muted)]">
                        <span>Progreso: {formatProgressLabel(enrollment.progressPercentage)}</span>
                        <span>Lecciones: {enrollment.completedLessons}/{enrollment.totalLessons}</span>
                        <span>Fecha de inscripción: {formatDate(enrollment.enrolled_at)}</span>
                      </div>
                    </div>
                    <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(107,92,224,0.06)] p-4">
                      <p className="uc-kicker">Acción rápida</p>
                      <form action={upsertStudentCourseAccessAction}>
                        <input name="return_to" type="hidden" value={canonicalReturnTo} />
                        <input name="target_student_profile_id" type="hidden" value={student.profile.id} />
                        <input name="target_course_id" type="hidden" value={enrollment.course_id} />
                        <input name="target_cohort_id" type="hidden" value={enrollment.cohort_id ?? ""} />
                        <input name="enable_access" type="hidden" value={enrollment.access_state === "enabled" ? "false" : "true"} />
                        <button className="uc-button-secondary w-full justify-center" type="submit">
                          {enrollment.access_state === "enabled" ? "Revocar acceso" : "Restaurar acceso"}
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
            Esta cuenta no es una alumna activa, así que aquí no se gestionan enrollments ni accesos académicos.
          </p>
        )}
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div>
          <p className="uc-kicker">Tareas</p>
          <h2 className="mt-2 font-heading text-3xl">Entregas, pendientes y feedback</h2>
        </div>

        {student.submissions.length === 0 ? (
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
            Todavía no hay tareas registradas para esta cuenta. La sección queda preparada para mostrar entregas, revisiones y feedback real.
          </p>
        ) : (
          <div className="grid gap-3">
            {student.submissions.map((submission) => (
              <div key={submission.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusChip tone={submission.status === "approved" ? "teal" : submission.status === "submitted" ? "amber" : "violet"}>
                    {formatSubmissionStatusLabel(submission.status)}
                  </StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">
                    {submission.course?.title ?? "Curso"} · {formatDateTime(submission.submitted_at ?? submission.created_at)}
                  </span>
                </div>
                <h3 className="mt-3 font-heading text-2xl">{submission.assignment?.title ?? "Entrega sin título"}</h3>
                <p className="mt-2 text-sm text-[var(--uc-muted)]">
                  {submission.reviewed_at ? `Revisada el ${formatDateTime(submission.reviewed_at)}` : "Pendiente de revisión"}
                </p>
                {submission.instructor_feedback ? (
                  <p className="mt-3 text-[15px] leading-7 text-[var(--uc-muted)]">{submission.instructor_feedback}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div>
          <p className="uc-kicker">Sesiones en vivo</p>
          <h2 className="mt-2 font-heading text-3xl">Clases relacionadas con sus cursos</h2>
        </div>

        {student.liveClasses.length === 0 ? (
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
            Todavía no hay sesiones futuras relacionadas con sus cursos. La asistencia puede engancharse aquí en una siguiente fase sin rediseñar la pantalla.
          </p>
        ) : (
          <div className="grid gap-3">
            {student.liveClasses.map((liveClass) => (
              <div key={liveClass.id} className="grid gap-4 rounded-[22px] border border-[var(--uc-border)] p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <StatusChip tone={liveClass.status === "published" ? "teal" : "amber"}>
                      {liveClass.status === "published" ? "Publicada" : "Borrador"}
                    </StatusChip>
                    <span className="text-sm text-[var(--uc-muted)]">{liveClass.course?.title ?? "Curso"}</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl">{liveClass.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                      {formatLiveClassDate(liveClass.starts_at)} · {formatLiveClassTimeRange(liveClass.starts_at, liveClass.duration_minutes)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--uc-muted)]">
                    <span>Instructora: {liveClass.instructor_name}</span>
                    <span>Cohorte: {liveClass.cohort?.name ?? "Sin cohorte"}</span>
                  </div>
                </div>
                <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.08)] p-4">
                  <p className="uc-kicker">Accesos preparados</p>
                  <Link className="uc-button-secondary justify-center" href={buildGoogleCalendarUrl(liveClass)} rel="noreferrer" target="_blank">
                    Abrir en Google Calendar
                  </Link>
                  {liveClass.meeting_url ? (
                    <Link className="uc-button-primary justify-center" href={liveClass.meeting_url} rel="noreferrer" target="_blank">
                      Abrir Google Meet
                    </Link>
                  ) : (
                    <p className="text-sm leading-6 text-[var(--uc-muted)]">Esta sesión todavía no tiene link de Google Meet cargado.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
