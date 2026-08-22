import Link from "next/link";

import { ArrowUpRight, CalendarDays, Clock3, Video } from "lucide-react";

import { DashboardHeader } from "@/components/student/dashboard-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import {
  buildGoogleCalendarUrl,
  buildLiveClassesMonthView,
  formatLiveClassDate,
  formatLiveClassTime,
  formatLiveClassTimeRange,
  getLiveClassAccessDetails,
  getLiveClassTimeZoneLabel,
} from "@/lib/live-classes";
import { getUpcomingLiveClasses } from "@/lib/student-dashboard";

const GOOGLE_CALENDAR_HOME_URL = "https://calendar.google.com/calendar/u/0/r";

export default async function StudentClassesPage() {
  const viewer = await requireAuthenticatedViewer("/mis-clases");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const liveClasses = getUpcomingLiveClasses(snapshot.liveClasses);
  const nextLiveClass = liveClasses[0] ?? null;
  const calendar = buildLiveClassesMonthView(liveClasses);

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Clases en vivo"
        title="Tu calendario de sesiones"
        description="Una vista tipo Google Calendar con nuestra paleta para que ubiques tus clases, guardes cada una en tu agenda y tengas el enlace de Google Meet siempre a la mano."
        firstName={viewer.first_name}
      />

      <SectionCard className="grid gap-4 rounded-[32px] bg-[linear-gradient(135deg,rgba(107,92,224,0.1),rgba(255,255,255,0.92),rgba(47,169,143,0.08))]">
        <div className="grid gap-2">
          <p className="uc-kicker">Calendario UniCourse</p>
          <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Agenda de clases</h2>
        </div>

        <p className="max-w-3xl text-base leading-7 text-[var(--uc-muted)]">
          Cada clase vive dentro del calendario con su color, horario, curso e instructora. Desde aquí puedes guardar la
          sesión con un clic y entrar directo al Google Meet correspondiente.
        </p>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px] 2xl:grid-cols-[minmax(0,1.7fr)_390px]">
        <SectionCard className="overflow-hidden rounded-[34px] p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,240,251,0.86))] px-5 py-5 sm:px-6">
            <div className="grid gap-1">
              <p className="uc-kicker">Vista mensual</p>
              <h2 className="font-heading text-3xl text-[var(--uc-ink)]">{calendar.monthLabel}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--uc-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(47,169,143,0.1)] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--uc-teal)]" />
                Links de Meet
              </span>
            </div>
          </div>

          {!calendar.hasClassesInMonth ? (
            <div className="border-b border-[var(--uc-border)] bg-[rgba(107,92,224,0.04)] px-5 py-4 text-sm leading-7 text-[var(--uc-muted)] sm:px-6">
              Este mes aún no tiene sesiones publicadas. En cuanto se programe una clase, aparecerá aquí dentro del calendario
              con su botón para Google Calendar y su enlace de Google Meet.
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-7 border-b border-[var(--uc-border)] bg-[rgba(255,255,255,0.72)]">
                {calendar.weekdayLabels.map((weekday) => (
                  <div key={weekday} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--uc-muted)]">
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendar.days.map((day) => (
                  <div
                    key={day.dateKey}
                    className={cn(
                      "flex min-h-[148px] flex-col border-r border-b border-[var(--uc-border)] p-3 align-top",
                      !day.isCurrentMonth && "bg-[rgba(107,92,224,0.035)] text-[rgba(122,111,144,0.65)]",
                      day.isToday && "bg-[linear-gradient(180deg,rgba(107,92,224,0.06),rgba(255,255,255,0.94))]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                          day.isToday
                            ? "bg-[var(--uc-violet)] text-white"
                            : day.liveClasses.length > 0
                              ? "bg-[rgba(107,92,224,0.08)] text-[var(--uc-violet)]"
                              : "text-[var(--uc-ink)]",
                        )}
                      >
                        {day.dayNumber}
                      </span>

                      {day.liveClasses.length > 0 ? (
                        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--uc-muted)]">
                          {day.liveClasses.length} live
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-2">
                      {day.liveClasses.slice(0, 2).map((liveClass) => {
                        const access = getLiveClassAccessDetails(liveClass);
                        const primaryUrl = liveClass.meeting_url ?? buildGoogleCalendarUrl(liveClass);

                        return (
                          <a
                            key={liveClass.id}
                            className={cn(
                              "grid gap-1 rounded-[18px] border px-3 py-2 text-left shadow-[0_10px_20px_rgba(58,37,105,0.05)] transition hover:-translate-y-[1px]",
                              access.tone === "teal" &&
                                "border-[rgba(47,169,143,0.18)] bg-[linear-gradient(135deg,rgba(47,169,143,0.16),rgba(255,255,255,0.92))]",
                              access.tone === "violet" &&
                                "border-[rgba(107,92,224,0.16)] bg-[linear-gradient(135deg,rgba(107,92,224,0.14),rgba(255,255,255,0.94))]",
                              access.tone === "amber" &&
                                "border-[rgba(224,149,74,0.16)] bg-[linear-gradient(135deg,rgba(245,201,138,0.28),rgba(255,255,255,0.94))]",
                            )}
                            href={primaryUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--uc-muted)]">
                              {formatLiveClassTime(liveClass.starts_at)}
                            </span>
                            <span className="line-clamp-2 text-sm font-medium leading-5 text-[var(--uc-ink)]">{liveClass.title}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--uc-muted)]">
                              {liveClass.meeting_url ? "Google Meet" : "Guardar clase"}
                              <ArrowUpRight className="h-3 w-3" />
                            </span>
                          </a>
                        );
                      })}

                      {day.liveClasses.length > 2 ? (
                        <p className="rounded-full bg-[rgba(107,92,224,0.06)] px-3 py-1.5 text-xs font-medium text-[var(--uc-violet)]">
                          +{day.liveClasses.length - 2} más
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard className="grid gap-5 rounded-[32px]">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <p className="uc-kicker">Siguiente clase</p>
                <h2 className="font-heading text-3xl text-[var(--uc-ink)]">
                  {nextLiveClass ? nextLiveClass.title : "Tu agenda está lista"}
                </h2>
              </div>

              {nextLiveClass ? <StatusChip tone={getLiveClassAccessDetails(nextLiveClass).tone}>{getLiveClassAccessDetails(nextLiveClass).label}</StatusChip> : null}
            </div>

            {nextLiveClass ? (
              <>
                <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(107,92,224,0.08),rgba(255,255,255,0.9))] p-5">
                  <p className="uc-kicker">Resumen rápido</p>
                  <p className="text-base leading-7 text-[var(--uc-muted)]">
                    {nextLiveClass.course?.title ?? "UniCourse"} con {nextLiveClass.instructor_name}
                  </p>
                  <div className="grid gap-3 text-sm text-[var(--uc-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[var(--uc-violet)]" />
                      {formatLiveClassDate(nextLiveClass.starts_at)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-[var(--uc-violet)]" />
                      {formatLiveClassTimeRange(nextLiveClass.starts_at, nextLiveClass.duration_minutes)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Video className="h-4 w-4 text-[var(--uc-violet)]" />
                      {getLiveClassTimeZoneLabel()}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-7 text-[var(--uc-muted)]">{getLiveClassAccessDetails(nextLiveClass).description}</p>

                <div className="grid gap-3">
                  <a className="uc-button-secondary" href={buildGoogleCalendarUrl(nextLiveClass)} rel="noreferrer" target="_blank">
                    Agregar a Google Calendar
                  </a>

                  {nextLiveClass.meeting_url ? (
                    <a className="uc-button-primary" href={nextLiveClass.meeting_url} rel="noreferrer" target="_blank">
                      {nextLiveClass.canJoin ? "Entrar a Google Meet" : "Abrir enlace de Meet"}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p className="text-base leading-7 text-[var(--uc-muted)]">
                  Cuando publiquemos la siguiente sesión, la verás aquí destacada con su fecha, horario, botón para Google
                  Calendar y enlace de Google Meet.
                </p>

                <a className="uc-button-secondary" href={GOOGLE_CALENDAR_HOME_URL} rel="noreferrer" target="_blank">
                  Abrir Google Calendar
                </a>
              </>
            )}
          </SectionCard>

          <SectionCard className="grid gap-4 rounded-[32px]">
            <div className="grid gap-1">
              <p className="uc-kicker">Agenda del mes</p>
              <h2 className="font-heading text-3xl text-[var(--uc-ink)]">
                {calendar.currentMonthClassCount > 0 ? `${calendar.currentMonthClassCount} sesiones visibles` : "Mes despejado"}
              </h2>
            </div>

            {liveClasses.length > 0 ? (
              <div className="grid gap-3">
                {liveClasses.slice(0, 6).map((liveClass) => (
                  <div key={liveClass.id} className="grid gap-3 rounded-[22px] border border-[var(--uc-border)] bg-white/78 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid gap-1">
                        <p className="text-sm font-semibold text-[var(--uc-ink)]">{liveClass.title}</p>
                        <p className="text-sm leading-6 text-[var(--uc-muted)]">{formatLiveClassDate(liveClass.starts_at)}</p>
                      </div>
                      <StatusChip tone={getLiveClassAccessDetails(liveClass).tone}>{getLiveClassAccessDetails(liveClass).label}</StatusChip>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={buildGoogleCalendarUrl(liveClass)} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--uc-border)] px-3 py-2 text-xs font-medium text-[var(--uc-violet)]">
                        Google Calendar
                      </Link>

                      {liveClass.meeting_url ? (
                        <Link href={liveClass.meeting_url} target="_blank" rel="noreferrer" className="rounded-full bg-[rgba(47,169,143,0.12)] px-3 py-2 text-xs font-medium text-[var(--uc-teal)]">
                          Google Meet
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--uc-border)] bg-[rgba(255,255,255,0.74)] p-5 text-sm leading-7 text-[var(--uc-muted)]">
                Aún no hay clases cargadas este mes, pero el calendario ya quedó listo para recibirlas con la misma lógica
                visual de una agenda real.
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
