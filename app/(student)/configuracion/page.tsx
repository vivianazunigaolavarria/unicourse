import Link from "next/link";

import { SignOutForm } from "@/components/auth/sign-out-form";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { SectionCard } from "@/components/ui/section-card";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { formatAccountStatusLabel, formatRoleLabel } from "@/lib/labels";

export default async function SettingsPage() {
  const viewer = await requireAuthenticatedViewer("/configuracion");

  return (
    <div className="grid gap-6">
      <DashboardHeader
        eyebrow="Configuración"
        title="Tu cuenta, con calma"
        description="Aquí dejamos a mano lo esencial: el estado de tu acceso, tus datos principales y la salida segura de tu sesión."
        firstName={viewer.first_name}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard className="grid gap-5 rounded-[28px] p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Resumen de cuenta</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Lo importante de tu acceso</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4">
              <p className="uc-kicker">Rol</p>
              <p className="mt-3 text-lg text-[var(--uc-ink)]">{formatRoleLabel(viewer.role)}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4">
              <p className="uc-kicker">Estado</p>
              <p className="mt-3 text-lg text-[var(--uc-ink)]">{formatAccountStatusLabel(viewer.account_status)}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4 sm:col-span-2">
              <p className="uc-kicker">Correo electrónico</p>
              <p className="mt-3 text-lg text-[var(--uc-ink)]">{viewer.email}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--uc-border)] bg-white/78 p-5">
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
              Si necesitas cambiar tus datos personales, puedes hacerlo desde tu perfil. El rol, el identificador y los permisos siguen protegidos del lado del servidor.
            </p>
            <div className="mt-4">
              <Link href="/perfil" className="uc-button-secondary">
                Ir a mi perfil
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="grid gap-5 rounded-[28px] p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Sesión</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Salida segura</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
              Cierra tu sesión cuando termines para mantener tu cuenta protegida, sobre todo si compartes dispositivo.
            </p>
          </div>

          <SignOutForm />
        </SectionCard>
      </div>
    </div>
  );
}
