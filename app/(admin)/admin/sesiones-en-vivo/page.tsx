import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminLiveClassSnapshot } from "@/lib/data/admin";
import { buildGoogleCalendarUrl, formatLiveClassDate, formatLiveClassTimeRange } from "@/lib/live-classes";

export default async function AdminLiveClassesPage() {
  const snapshot = await getAdminLiveClassSnapshot(12);

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <div className="grid gap-4">
          <StatusChip tone="violet">Sesiones en vivo</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Arquitectura lista para operar una agenda real de clases.</h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
            Esta vista ya concentra sesiones guardadas en Supabase con fecha, curso, instructora y accesos de Google
            Meet o Google Calendar, sin construir todavía el sistema completo de programación.
          </p>
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

      {snapshot.classes.length === 0 ? (
        <EmptyState
          title="Aún no hay sesiones próximas"
          description="Cuando el equipo programe nuevas clases en vivo, aparecerán aquí con su fecha, curso y enlaces listos."
        />
      ) : (
        <div className="grid gap-4">
          {snapshot.classes.map((liveClass) => (
            <SectionCard key={liveClass.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
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
                  <p className="text-sm leading-6 text-[var(--uc-muted)]">Esta sesión todavía no tiene un enlace de Google Meet cargado.</p>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </>
  );
}
