import { DashboardHeader } from "@/components/student/dashboard-header";
import { StudentProfileForm } from "@/components/profile/student-profile-form";
import { SectionCard } from "@/components/ui/section-card";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { formatAccountStatusLabel, formatDate, formatOccupationValue } from "@/lib/labels";

export default async function ProfilePage() {
  const viewer = await requireAuthenticatedViewer("/perfil");

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Mi perfil"
        title="Tu información personal"
        description="Mantén tus datos básicos actualizados para que UniCourse te acompañe mejor y respete el ritmo real de tu aprendizaje."
        firstName={viewer.first_name}
      />

      <SectionCard className="grid gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-10">
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.08)] p-5">
            <p className="uc-kicker">Perfil activo</p>
            <p className="mt-3 text-[15px] leading-7 text-[var(--uc-muted)]">
              Tu correo y tu rol siguen protegidos desde backend. Aquí sólo puedes editar los datos personales permitidos para tu propia cuenta.
            </p>
          </div>

          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Desde aquí puedes revisar y actualizar los datos básicos que sí forman parte de tu perfil estudiantil.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/82 p-4">
              <p className="uc-kicker">Estado</p>
              <p className="mt-3 text-lg text-[var(--uc-ink)]">{formatAccountStatusLabel(viewer.account_status)}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/82 p-4">
              <p className="uc-kicker">Registro</p>
              <p className="mt-3 text-lg text-[var(--uc-ink)]">{formatDate(viewer.created_at)}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/82 p-4">
              <p className="uc-kicker">Ocupación</p>
              <p className="mt-3 text-lg text-[var(--uc-ink)]">{formatOccupationValue(viewer.occupation)}</p>
            </div>
          </div>
        </div>

        <SectionCard className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,252,0.96))] p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Mi perfil</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Tu información personal</h2>
            <p className="text-sm leading-7 text-[var(--uc-muted)]">Mantén estos datos al día para que UniCourse te acompañe mejor.</p>
          </div>

          <StudentProfileForm profile={viewer} />
        </SectionCard>
      </SectionCard>
    </div>
  );
}
