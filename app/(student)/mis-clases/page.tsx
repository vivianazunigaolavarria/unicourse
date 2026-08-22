import { ArrowUpRight, CalendarDays, Clock3, Video } from "lucide-react";

import { DashboardEmptyState } from "@/components/student/dashboard-empty-state";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { requireAuthenticatedViewer } from "@/lib/auth";
import {
  buildGoogleCalendarUrl,
  formatLiveClassDate,
  formatLiveClassDay,
  formatLiveClassMonth,
  formatLiveClassTime,
  formatLiveClassTimeRange,
  getLiveClassAccessDetails,
  getLiveClassTimeZoneLabel,
} from "@/lib/live-classes";
import { getUpcomingLiveClasses } from "@/lib/student-dashboard";

export default async function StudentClassesPage() {
  const viewer = await requireAuthenticatedViewer("/mis-clases");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const liveClasses = getUpcomingLiveClasses(snapshot.liveClasses);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Clases en vivo"
        title="Tus próximas sesiones"
        description="Aquí verás cada clase con su fecha, horario, enlace de acceso y un atajo para guardarla en Google Calendar."
        firstName={viewer.first_name}
      />

      {liveClasses.length === 0 ? (
        <DashboardEmptyState
          title="No tienes clases en vivo programadas por ahora."
          description="Cuando se confirme la siguiente sesión, verás aquí la fecha, la hora, la instructora y el acceso correspondiente."
        />
      ) : (
        <div className="grid gap-4">
          <SectionCard className="grid gap-4 rounded-[32px] bg-[linear-gradient(135deg,rgba(107,92,224,0.08),rgba(47,169,143,0.06),rgba(255,255,255,0.92))]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="grid gap-2">
                <p className="uc-kicker">Agenda de acompañamiento</p>
                <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Tus sesiones en vivo, claras y a tiempo</h2>
              </div>
              <StatusChip tone="teal">{`${liveClasses.length} ${liveClasses.length === 1 ? "clase agendada" : "clases agendadas"}`}</StatusChip>
            </div>

            <p className="max-w-3xl text-base leading-7 text-[var(--uc-muted)]">
              Cada sesión muestra el horario en Ciudad de México, el acceso a Google Meet y un botón para guardarla en tu
              calendario. Así no tienes que buscar correos ni enlaces a último momento.
            </p>
          </SectionCard>

          {liveClasses.map((liveClass) => {
            const access = getLiveClassAccessDetails(liveClass);
            const calendarUrl = buildGoogleCalendarUrl(liveClass);

            return (
              <SectionCard key={liveClass.id} className="overflow-hidden rounded-[32px] p-0">
                <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="border-b border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(107,92,224,0.10),rgba(255,255,255,0.4))] p-6 lg:border-r lg:border-b-0">
                    <p className="uc-kicker">Próxima fecha</p>
                    <div className="mt-6 flex items-end gap-3">
                      <p className="font-heading text-6xl leading-none text-[var(--uc-ink)]">{formatLiveClassDay(liveClass.starts_at)}</p>
                      <p className="pb-2 text-sm font-semibold tracking-[0.22em] text-[var(--uc-muted)]">
                        {formatLiveClassMonth(liveClass.starts_at)}
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 text-sm text-[var(--uc-muted)]">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[var(--uc-violet)]" />
                        {formatLiveClassDate(liveClass.starts_at)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[var(--uc-violet)]" />
                        {formatLiveClassTime(liveClass.starts_at)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Video className="h-4 w-4 text-[var(--uc-violet)]" />
                        {getLiveClassTimeZoneLabel()}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]">
                            <Video className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="uc-kicker">Clase programada</p>
                            <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">{liveClass.title}</h2>
                          </div>
                        </div>

                        <p className="text-base leading-7 text-[var(--uc-muted)]">
                          {liveClass.course?.title ?? "UniCourse"} con {liveClass.instructor_name}
                        </p>
                      </div>

                      <StatusChip tone={access.tone}>{access.label}</StatusChip>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4">
                        <p className="uc-kicker">Horario</p>
                        <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">
                          {formatLiveClassTimeRange(liveClass.starts_at, liveClass.duration_minutes)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--uc-muted)]">{getLiveClassTimeZoneLabel()}</p>
                      </div>

                      <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4">
                        <p className="uc-kicker">Duración</p>
                        <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{liveClass.duration_minutes} minutos</p>
                        <p className="mt-2 text-sm text-[var(--uc-muted)]">Ideal para entrar con calma y quedarte hasta el cierre.</p>
                      </div>

                      <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4">
                        <p className="uc-kicker">Acceso</p>
                        <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{access.label}</p>
                        <p className="mt-2 text-sm text-[var(--uc-muted)]">{access.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a className="uc-button-secondary" href={calendarUrl} rel="noreferrer" target="_blank">
                        Agregar a Google Calendar
                      </a>

                      {liveClass.canJoin && liveClass.meeting_url ? (
                        <a className="uc-button-primary" href={liveClass.meeting_url} rel="noreferrer" target="_blank">
                          Entrar a la clase
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
