import Link from "next/link";

import { ArrowUpRight, CalendarDays, Clock3, Video } from "lucide-react";

import type { StudentLiveClassSummary } from "@/lib/data/student";
import { formatDateTime } from "@/lib/labels";

type LiveClassCardProps = {
  liveClass: StudentLiveClassSummary;
};

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  return (
    <div className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,247,252,0.94))] p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]">
          <Video className="h-5 w-5" />
        </span>
        <div>
          <p className="uc-kicker">Próxima clase en vivo</p>
          <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">{liveClass.title}</h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/76 p-4">
          <p className="uc-kicker">Curso</p>
          <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{liveClass.course?.title ?? "Clase en UniCourse"}</p>
        </div>
        <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/76 p-4">
          <p className="uc-kicker">Imparte</p>
          <p className="mt-3 text-base font-medium text-[var(--uc-ink)]">{liveClass.instructor_name}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-white/76 p-4">
        <div className="flex items-center gap-3 text-sm text-[var(--uc-muted)]">
          <CalendarDays className="h-4 w-4 text-[var(--uc-violet)]" />
          <span>{formatDateTime(liveClass.starts_at)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--uc-muted)]">
          <Clock3 className="h-4 w-4 text-[var(--uc-violet)]" />
          <span>{liveClass.duration_minutes} minutos</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/mis-clases" className="uc-button-secondary">
          Ver detalles
        </Link>
        {liveClass.canJoin && liveClass.meeting_url ? (
          <Link href={liveClass.meeting_url} target="_blank" rel="noreferrer" className="uc-button-primary">
            Entrar a la clase
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
