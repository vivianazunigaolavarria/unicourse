import Link from "next/link";

import { ArrowUpRight, CalendarDays, Clock3, Video } from "lucide-react";

import type { StudentLiveClassSummary } from "@/lib/data/student";
import {
  buildGoogleCalendarUrl,
  formatLiveClassDate,
  formatLiveClassTimeRange,
  getLiveClassAccessDetails,
  getLiveClassTimeZoneLabel,
} from "@/lib/live-classes";
import { StatusChip } from "@/components/ui/status-chip";

type LiveClassCardProps = {
  liveClass: StudentLiveClassSummary;
};

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  const calendarUrl = buildGoogleCalendarUrl(liveClass);
  const access = getLiveClassAccessDetails(liveClass);

  return (
    <div className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,247,252,0.94))] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <p className="uc-kicker">Próxima clase en vivo</p>
            <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">{liveClass.title}</h2>
          </div>
        </div>

        <StatusChip tone={access.tone}>{access.label}</StatusChip>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/76 p-4">
          <p className="uc-kicker">Curso</p>
          <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{liveClass.course?.title ?? "Clase en UniCourse"}</p>
        </div>
        <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/76 p-4">
          <p className="uc-kicker">Imparte</p>
          <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{liveClass.instructor_name}</p>
        </div>
        <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/76 p-4">
          <p className="uc-kicker">{getLiveClassTimeZoneLabel()}</p>
          <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{formatLiveClassTimeRange(liveClass.starts_at, liveClass.duration_minutes)}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-white/76 p-4">
        <div className="flex items-center gap-3 text-sm text-[var(--uc-muted)]">
          <CalendarDays className="h-4 w-4 text-[var(--uc-violet)]" />
          <span>{formatLiveClassDate(liveClass.starts_at)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--uc-muted)]">
          <Clock3 className="h-4 w-4 text-[var(--uc-violet)]" />
          <span>{liveClass.duration_minutes} minutos</span>
        </div>
        <p className="text-sm leading-6 text-[var(--uc-muted)]">{access.description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={calendarUrl} target="_blank" rel="noreferrer" className="uc-button-secondary">
          Agregar a Google Calendar
        </Link>
        {liveClass.canJoin && liveClass.meeting_url ? (
          <Link href={liveClass.meeting_url} target="_blank" rel="noreferrer" className="uc-button-primary">
            Entrar a la clase
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link href="/mis-clases" className="uc-button-secondary">
            Ver agenda completa
          </Link>
        )}
      </div>
    </div>
  );
}
