import { studentNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SessionRail } from "@/components/layout/session-rail";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getStudentPortalSnapshot } from "@/lib/data/student";
import { formatAccountStatusLabel, formatAgeRangeLabel, formatDate, formatProgressLabel } from "@/lib/labels";
import { getDisplayName } from "@/lib/profile";

export default async function ProfilePage() {
  const viewer = await requireAuthenticatedViewer("/perfil");
  const snapshot = await getStudentPortalSnapshot(viewer.id);
  const averageProgress =
    snapshot.enrollments.length === 0
      ? 0
      : Math.round(
          snapshot.enrollments.reduce((sum, enrollment) => sum + enrollment.progressPercentage, 0) /
            snapshot.enrollments.length,
        );

  return (
    <AppShell
      badge="Portal de alumna"
      title="Mi perfil"
      description="Tu información, tu estado de cuenta y el resumen de tus cursos en una sola vista."
      navItems={studentNavigation}
      rightRail={
        <SessionRail
          viewer={viewer}
          variant="student"
          highlight={{
            label: "Estado de cuenta",
            value: formatAccountStatusLabel(viewer.account_status),
          }}
        />
      }
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4">
          <StatusChip tone="violet">Perfil de aprendizaje</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">{getDisplayName(viewer)}</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            {snapshot.enrollments.length > 0
              ? `${snapshot.enrollments.length} curso(s) vinculado(s) a tu cuenta.`
              : "Tu perfil está listo para recibir accesos cuando el equipo administrativo lo indique."}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Progreso general</p>
            <p className="mt-3 font-heading text-4xl">{formatProgressLabel(averageProgress)}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Estado</p>
            <p className="mt-3 text-lg text-[var(--uc-ink)]">{formatAccountStatusLabel(viewer.account_status)}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard className="grid gap-4">
          <h2 className="font-heading text-3xl">Datos personales</h2>
          <div className="grid gap-3 text-[15px] leading-7 text-[var(--uc-muted)]">
            <p>Correo: {viewer.email}</p>
            <p>País: {viewer.country ?? "Sin dato"}</p>
            <p>Teléfono: {viewer.phone ?? "Sin dato"}</p>
            <p>Rango de edad: {formatAgeRangeLabel(viewer.age_range)}</p>
            <p>Registro: {formatDate(viewer.created_at)}</p>
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <h2 className="font-heading text-3xl">Cursos vinculados</h2>
          <div className="grid gap-3">
            {snapshot.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={enrollment.access_state === "enabled" ? "teal" : "amber"}>
                    {enrollment.access_state === "enabled" ? "Con acceso" : "Acceso pausado"}
                  </StatusChip>
                </div>
                <h3 className="mt-3 font-heading text-2xl">{enrollment.courses?.title ?? "Curso"}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                  Progreso: {formatProgressLabel(enrollment.progressPercentage)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
