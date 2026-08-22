import { notFound } from "next/navigation";

import { upsertStudentCourseAccessAction } from "@/app/(admin)/admin/actions";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import {
  formatAccessStateLabel,
  formatAccountStatusLabel,
  formatAgeRangeLabel,
  formatDate,
  formatDateTime,
  formatEnrollmentStatusLabel,
  formatProgressLabel,
  formatSubmissionStatusLabel,
} from "@/lib/labels";
import { getStudentAdminDetail, getStudentEnrollmentOptions } from "@/lib/data/admin";
import { readSearchParam } from "@/lib/search-params";

type StudentAdminDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const studentNoticeMessages: Record<string, { title: string; description: string; tone: "info" | "success" | "error" }> = {
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
};

export default async function StudentAdminDetailPage({ params, searchParams }: StudentAdminDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const noticeCode = readSearchParam(query?.notice);
  const pageNotice = noticeCode ? studentNoticeMessages[noticeCode] ?? null : null;

  const [student, courseOptions] = await Promise.all([
    getStudentAdminDetail(id),
    getStudentEnrollmentOptions(id),
  ]);

  if (!student) {
    notFound();
  }

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="violet">{formatAccountStatusLabel(student.profile.account_status)}</StatusChip>
            <span className="text-sm text-[var(--uc-muted)]">Última actividad: {formatDateTime(student.lastActivityAt)}</span>
          </div>
          <div>
            <h1 className="font-heading text-5xl leading-tight">
              {student.profile.display_name?.trim() || `${student.profile.first_name} ${student.profile.last_name}`}
            </h1>
            <p className="mt-3 text-lg leading-8 text-[var(--uc-muted)]">{student.profile.email}</p>
          </div>
          <div className="grid gap-2 text-[15px] leading-7 text-[var(--uc-muted)] md:grid-cols-2">
            <p>País: {student.profile.country ?? "Sin dato"}</p>
            <p>Teléfono: {student.profile.phone ?? "Sin dato"}</p>
            <p>Rango de edad: {formatAgeRangeLabel(student.profile.age_range)}</p>
            <p>Registro: {formatDate(student.profile.created_at)}</p>
          </div>
          {pageNotice ? <NoticeBanner {...pageNotice} /> : null}
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Cursos inscritos</p>
            <p className="mt-3 font-heading text-4xl">{student.enrollments.length}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Entregas registradas</p>
            <p className="mt-3 font-heading text-4xl">{student.submissions.length}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="uc-kicker">Gestión de acceso</p>
            <h2 className="mt-2 font-heading text-3xl">Otorgar curso</h2>
          </div>
        </div>

        <form action={upsertStudentCourseAccessAction} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <input name="return_to" type="hidden" value={`/admin/students/${student.profile.id}`} />
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
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="uc-kicker">Inscripciones</p>
            <h2 className="mt-2 font-heading text-3xl">Estado por curso</h2>
          </div>
        </div>

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
                </div>
              </div>
              <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(107,92,224,0.06)] p-4">
                <p className="uc-kicker">Acción rápida</p>
                <form action={upsertStudentCourseAccessAction}>
                  <input name="return_to" type="hidden" value={`/admin/students/${student.profile.id}`} />
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
      </SectionCard>

      <SectionCard className="grid gap-4">
        <div>
          <p className="uc-kicker">Entregas</p>
          <h2 className="mt-2 font-heading text-3xl">Historial de submissions</h2>
        </div>

        <div className="grid gap-3">
          {student.submissions.length === 0 ? (
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Todavía no hay entregas registradas para esta alumna.</p>
          ) : (
            student.submissions.map((submission) => (
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
                {submission.instructor_feedback ? (
                  <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">{submission.instructor_feedback}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </>
  );
}
