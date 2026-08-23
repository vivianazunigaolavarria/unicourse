import Link from "next/link";

import { createLiveClassAction } from "@/app/(admin)/admin/actions";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminLiveClassFormOptions, getAdminLiveClassSnapshot } from "@/lib/data/admin";
import { getGoogleCalendarIntegrationState } from "@/lib/google-calendar";
import { formatDateTime } from "@/lib/labels";
import { readSearchParam } from "@/lib/search-params";
import { buildGoogleCalendarUrl, formatLiveClassDate, formatLiveClassTimeRange } from "@/lib/live-classes";

type AdminLiveClassesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const liveClassNoticeMessages: Record<string, { title: string; description: string; tone: "info" | "success" | "error" }> = {
  "live-class-created": {
    title: "Sesión publicada",
    description: "La clase ya quedó creada con Google Meet y las invitaciones salieron hacia las alumnas activas inscritas.",
    tone: "success",
  },
  "live-class-invalid": {
    title: "Revisa los datos",
    description: "Confirma curso, cohorte, fecha, hora y duración. La sesión debe quedar programada en el futuro.",
    tone: "error",
  },
  "live-class-create-failed": {
    title: "No pudimos crear la sesión",
    description: "Falló la creación del evento en Google Calendar o el guardado final en Supabase. No dejamos una sesión rota publicada.",
    tone: "error",
  },
  "live-class-google-not-configured": {
    title: "Falta conectar Google",
    description: "Agrega las credenciales de Google Calendar para poder crear Meet e invitar alumnas desde el panel.",
    tone: "error",
  },
};

function getCurrentMexicoDateInputValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export default async function AdminLiveClassesPage({ searchParams }: AdminLiveClassesPageProps) {
  const params = (await searchParams) ?? {};
  const noticeCode = readSearchParam(params.notice);
  const errorCode = readSearchParam(params.error);
  const pageBanner = noticeCode
    ? liveClassNoticeMessages[noticeCode] ?? null
    : errorCode
      ? liveClassNoticeMessages[errorCode] ?? null
      : null;

  const [snapshot, formOptions] = await Promise.all([
    getAdminLiveClassSnapshot(12),
    getAdminLiveClassFormOptions(),
  ]);
  const googleState = getGoogleCalendarIntegrationState();
  const minScheduleDate = getCurrentMexicoDateInputValue();

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <div className="grid gap-4">
          <div className="inline-flex max-w-full rounded-full border border-[var(--uc-border)] bg-[linear-gradient(135deg,rgba(122,94,255,0.16),rgba(122,94,255,0.08))] px-8 py-5 shadow-[0_18px_45px_rgba(122,94,255,0.08)]">
            <h1 className="font-heading text-4xl leading-none text-[var(--uc-accent)] sm:text-5xl">Sesiones en vivo</h1>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
            Programa clases reales desde el panel, crea el Google Meet con el nombre del curso y envía la invitación a
            las alumnas activas inscritas para que también aparezca dentro de su agenda de UniCourse.
          </p>
          {pageBanner ? <NoticeBanner {...pageBanner} /> : null}
          {!googleState.configured ? (
            <NoticeBanner
              tone="info"
              title="Conexión de Google pendiente"
              description={`Para activar la creación automática agrega: ${googleState.missingKeys.join(", ")}. GOOGLE_CALENDAR_ID es opcional y, si no existe, se usa el calendario principal de la cuenta conectada.`}
            />
          ) : null}
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Publicadas</p>
            <p className="mt-3 font-heading text-4xl">{snapshot.publishedCount}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Próximas</p>
            <p className="mt-3 font-heading text-4xl">{snapshot.upcomingCount}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Borradores</p>
            <p className="mt-3 font-heading text-4xl">{snapshot.draftCount}</p>
          </div>
        </div>
      </SectionCard>

      {formOptions.courses.length === 0 ? (
        <EmptyState
          title="Primero necesitamos un curso"
          description="Crea al menos un curso para poder programar clases en vivo con Google Meet y mandarlas a las alumnas correctas."
          action={
            <Link className="uc-button-primary" href="/admin/cursos/nuevo">
              Crear curso
            </Link>
          }
        />
      ) : (
        <SectionCard className="grid gap-5">
          <div className="grid gap-3">
            <StatusChip tone="violet">Programar sesión</StatusChip>
            <h2 className="font-heading text-4xl leading-tight">Crea una sesión y manda invitaciones automáticas</h2>
            <p className="max-w-3xl text-[15px] leading-7 text-[var(--uc-muted)]">
              La sesión se publicará con el nombre del curso, quedará visible en `Mis clases` y enviará la invitación
              del calendario a las alumnas activas inscritas en ese curso o cohorte.
            </p>
          </div>

          <form action={createLiveClassAction} className="grid gap-4">
            <input name="return_to" type="hidden" value="/admin/sesiones-en-vivo" />

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Curso
                <select className="uc-input" defaultValue="" name="course_id" required>
                  <option disabled value="">
                    Selecciona un curso
                  </option>
                  {formOptions.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} {course.status === "draft" ? "· borrador" : "· publicado"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Cohorte
                <select className="uc-input" defaultValue="" name="cohort_id">
                  <option value="">Todas las alumnas del curso</option>
                  {formOptions.cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.courseTitle} · {cohort.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Fecha
                <input className="uc-input" min={minScheduleDate} name="starts_on" required type="date" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Hora
                <input className="uc-input" name="starts_at" required type="time" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Duración
                <select className="uc-input" defaultValue="60" name="duration_minutes">
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="75">75 minutos</option>
                  <option value="90">90 minutos</option>
                  <option value="120">120 minutos</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Notas para la sesión
              <textarea
                className="uc-textarea"
                name="description"
                placeholder="Tema del día, materiales o contexto que quieras incluir en la invitación."
                rows={4}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-[var(--uc-muted)]">
                El horario se publica en formato CDMX y Google genera un Meet único para esa sesión.
              </p>
              <button className="uc-button-primary" disabled={!googleState.configured} type="submit">
                Crear sesión y enviar invitaciones
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {snapshot.classes.length === 0 ? (
        <EmptyState
          title="Aún no hay sesiones programadas"
          description="En cuanto publiques la primera clase, aparecerá aquí con su Meet, su evento de Google Calendar y el total de alumnas invitadas."
        />
      ) : (
        <div className="grid gap-4">
          {snapshot.classes.map((liveClass) => {
            const calendarHref = liveClass.google_calendar_html_link ?? buildGoogleCalendarUrl(liveClass);

            return (
              <SectionCard key={liveClass.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <StatusChip tone={liveClass.status === "published" ? "teal" : "amber"}>
                      {liveClass.status === "published" ? "Publicada" : "Borrador"}
                    </StatusChip>
                    <span className="text-sm text-[var(--uc-muted)]">{liveClass.course?.title ?? "Curso"}</span>
                  </div>

                  <div>
                    <h2 className="font-heading text-3xl">{liveClass.title}</h2>
                    <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                      {formatLiveClassDate(liveClass.starts_at)} · {formatLiveClassTimeRange(liveClass.starts_at, liveClass.duration_minutes)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[var(--uc-muted)]">
                    <span>Instructora: {liveClass.instructor_name}</span>
                    <span>Cohorte: {liveClass.cohort?.name ?? "Todas"}</span>
                    <span>Invitadas: {liveClass.student_invite_count ?? 0}</span>
                  </div>

                  {liveClass.description ? (
                    <p className="max-w-3xl text-[15px] leading-7 text-[var(--uc-muted)]">{liveClass.description}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.08)] p-4">
                  <p className="uc-kicker">Sesión sincronizada</p>
                  <p className="text-sm leading-6 text-[var(--uc-muted)]">
                    Última sincronización: {formatDateTime(liveClass.calendar_last_synced_at ?? liveClass.starts_at)}
                  </p>
                  <Link className="uc-button-secondary justify-center" href={calendarHref} rel="noreferrer" target="_blank">
                    Abrir evento en Google Calendar
                  </Link>
                  {liveClass.meeting_url ? (
                    <Link className="uc-button-primary justify-center" href={liveClass.meeting_url} rel="noreferrer" target="_blank">
                      Abrir Google Meet
                    </Link>
                  ) : (
                    <p className="text-sm leading-6 text-[var(--uc-muted)]">Google todavía no devolvió el enlace de Meet para esta sesión.</p>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </>
  );
}
