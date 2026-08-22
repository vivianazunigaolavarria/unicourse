import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { LoginForm } from "@/components/auth/login-form";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { getOptionalViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getDashboardPathForRole } from "@/lib/profile";
import { readSearchParam } from "@/lib/search-params";
import { normalizeInternalPath } from "@/lib/urls";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const noticeMessages: Record<string, { title: string; description: string; tone: "info" | "success" | "error" }> = {
  "session-closed": {
    title: "Sesión cerrada",
    description: "Tu sesión se cerró correctamente.",
    tone: "success",
  },
  "password-updated": {
    title: "Contraseña actualizada",
    description: "Ya puedes iniciar sesión con tu nueva contraseña.",
    tone: "success",
  },
  "auth-link-invalid": {
    title: "Enlace inválido o vencido",
    description: "Solicita un correo nuevo para confirmar tu cuenta o restablecer tu contraseña.",
    tone: "error",
  },
  "email-confirmed": {
    title: "Correo confirmado",
    description: "Tu cuenta ya quedó validada. Ya puedes entrar a UniCourse.",
    tone: "success",
  },
  "otp-expired": {
    title: "Tu enlace ya expiró",
    description: "Pide un correo nuevo y usa el enlace más reciente para continuar.",
    tone: "error",
  },
  "auth-access-denied": {
    title: "No pudimos completar ese acceso",
    description: "El enlace es inválido, expiró o ya fue utilizado.",
    tone: "error",
  },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const notice = readSearchParam(params.notice);
  const rawNextPath = readSearchParam(params.next);
  const nextPath = rawNextPath ? normalizeInternalPath(rawNextPath, "/perfil") : null;
  const viewer = await getOptionalViewer();

  if (viewer) {
    redirect(nextPath ?? getDashboardPathForRole(viewer.role));
  }

  const supabaseReady = isSupabaseConfigured();
  const pageNotice = notice ? noticeMessages[notice] ?? null : null;

  return (
    <AuthPageFrame topActions={<Link className="uc-button-secondary" href="/registro">Crear mi cuenta</Link>}>
      <SectionCard className="grid w-full max-w-6xl gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-10">
        <div className="grid gap-5">
          <StatusChip tone="violet">Acceso a UniCourse</StatusChip>
          <div className="grid gap-3">
            <h1 className="font-heading text-5xl leading-tight">Vuelve a entrar con una experiencia clara y sencilla.</h1>
            <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
              Desde aquí puedes iniciar sesión, recuperar tu contraseña y retomar tu perfil sin complicaciones.
            </p>
          </div>

          {pageNotice ? <NoticeBanner {...pageNotice} /> : null}

          {!supabaseReady ? (
            <NoticeBanner
              title="Todavía estamos terminando esta parte"
              description="Estamos ajustando la conexión necesaria para habilitar el acceso y la recuperación."
              tone="error"
            />
          ) : null}
        </div>

        <SectionCard className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,252,0.96))] p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Iniciar sesión</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Tu cuenta te espera</h2>
            <p className="text-sm leading-7 text-[var(--uc-muted)]">Entra con tu correo y contraseña para seguir avanzando.</p>
          </div>

          {supabaseReady ? <LoginForm nextPath={nextPath} /> : null}
        </SectionCard>
      </SectionCard>
    </AuthPageFrame>
  );
}
