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
        <div className="grid content-start gap-8 lg:py-4">
          <div className="grid gap-3">
            <h1 className="font-heading text-5xl leading-tight">Crea tu cuenta</h1>
            <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
              Empecemos por conocerte un poquito. Queremos que entrar a UniCourse se sienta cálido, claro y fácil desde el inicio.
            </p>
          </div>

          <div className="flex">
            <div className="relative h-18 w-44 overflow-hidden rounded-full border border-[rgba(107,92,224,0.15)] bg-[linear-gradient(135deg,rgba(224,219,248,0.92),rgba(239,235,251,0.78))] shadow-[0_20px_44px_rgba(107,92,224,0.08)] sm:h-22 sm:w-56">
              <span className="absolute left-5 top-4 h-8 w-8 rounded-full bg-[rgba(201,166,242,0.42)] blur-md" />
              <span className="absolute right-6 top-6 h-10 w-10 rounded-full bg-[rgba(127,223,201,0.16)] blur-lg" />
            </div>
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
