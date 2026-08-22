import Link from "next/link";

import { SignOutForm } from "@/components/auth/sign-out-form";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { StudentProfileForm } from "@/components/profile/student-profile-form";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { formatAccountStatusLabel, formatDate, formatOccupationValue } from "@/lib/labels";
import { getDisplayName } from "@/lib/profile";

export default async function ProfilePage() {
  const viewer = await requireAuthenticatedViewer("/perfil");

  return (
    <AuthPageFrame topActions={<Link className="uc-button-secondary" href="/">Volver al inicio</Link>}>
      <SectionCard className="grid w-full max-w-6xl gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-10">
        <div className="grid gap-4">
          <StatusChip tone="teal">Perfil activo</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Hola, {getDisplayName(viewer)}.</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Tu cuenta ya quedó creada y confirmada. Desde aquí puedes revisar y actualizar los datos básicos de tu perfil.
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

          <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-white/78 p-5">
            <p className="text-sm leading-7 text-[var(--uc-muted)]">
              Tu correo y tu rol están protegidos desde backend. Aquí solo puedes editar los datos personales permitidos para tu propio perfil.
            </p>
            <div className="max-w-xs">
              <SignOutForm />
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
    </AuthPageFrame>
  );
}
