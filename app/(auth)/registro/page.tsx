import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { RegisterForm } from "@/components/auth/register-form";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { getOptionalViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getDashboardPathForRole } from "@/lib/profile";

export default async function RegisterPage() {
  const viewer = await getOptionalViewer();

  if (viewer) {
    redirect(getDashboardPathForRole(viewer.role));
  }

  const supabaseReady = isSupabaseConfigured();

  return (
    <AuthPageFrame topActions={<Link className="uc-button-secondary" href="/login">Iniciar sesión</Link>}>
      <SectionCard className="grid w-full max-w-6xl gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:p-10">
        <div className="grid gap-5">
          <div className="grid gap-3">
            <h1 className="font-heading text-5xl leading-tight">Crea tu cuenta</h1>
            <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
              Empecemos por conocerte un poquito. Queremos que entrar a UniCourse se sienta cálido, claro y fácil desde el inicio.
            </p>
          </div>

          <div className="grid gap-3 text-[15px] leading-7 text-[var(--uc-muted)]">
            <p>Después podrás volver a iniciar sesión cuando quieras con el mismo correo y tu contraseña.</p>
          </div>

          {!supabaseReady ? (
            <NoticeBanner
              title="Todavía estamos terminando esta parte"
              description="Estamos ajustando la conexión necesaria para abrir el registro al público."
              tone="error"
            />
          ) : null}
        </div>

        <SectionCard className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,252,0.96))] p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Nuevo acceso</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Tu cuenta en pocos pasos</h2>
            <p className="text-sm leading-7 text-[var(--uc-muted)]">Solo te pedimos lo necesario para dejar tu perfil bien creado desde el principio.</p>
          </div>

          {supabaseReady ? <RegisterForm /> : null}
        </SectionCard>
      </SectionCard>
    </AuthPageFrame>
  );
}
