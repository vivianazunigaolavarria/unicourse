import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { getOptionalViewer } from "@/lib/auth";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
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
    description: "Pide un nuevo correo para confirmar tu cuenta o restablecer tu contraseña.",
    tone: "error",
  },
  "email-confirmed": {
    title: "Correo confirmado",
    description: "Tu cuenta ya quedó validada. Ahora puedes entrar a UniCourse.",
    tone: "success",
  },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const notice = readSearchParam(params.notice);
  const nextPath = normalizeInternalPath(readSearchParam(params.next), "/mis-cursos");
  const viewer = await getOptionalViewer();

  if (viewer) {
    redirect(nextPath || getDashboardPathForRole(viewer.role));
  }

  const supabaseReady = isSupabaseConfigured();
  const pageNotice = notice ? noticeMessages[notice] ?? null : null;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl place-items-center px-4 py-10">
      <SectionCard className="grid w-full max-w-6xl gap-8 rounded-[34px] p-8 lg:p-10">
        <div className="grid gap-5">
          <StatusChip tone="violet">Acceso real con Supabase Auth</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Entra a UniCourse con claridad desde el primer paso.</h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
            Desde aquí ya puedes crear tu cuenta, iniciar sesión, recuperar contraseña y mantener
            la sesión activa entre visitas.
          </p>
          {pageNotice ? <NoticeBanner {...pageNotice} /> : null}
          {!supabaseReady ? (
            <NoticeBanner
              title="Falta terminar la conexión"
              description="Configura las variables públicas de Supabase en Vercel y en tu entorno local para habilitar registro, acceso y recuperación."
              tone="error"
            />
          ) : null}
        </div>

        {supabaseReady ? <AuthPanel appUrl={getAppUrl()} nextPath={nextPath} /> : null}
      </SectionCard>
    </main>
  );
}
