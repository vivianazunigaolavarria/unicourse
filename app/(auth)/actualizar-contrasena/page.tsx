import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { UpdatePasswordPanel } from "@/components/auth/update-password-panel";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";

export default function UpdatePasswordPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <AuthPageFrame>
      <SectionCard className="grid w-full gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:p-10">
        <div className="grid gap-5">
          <StatusChip tone="teal">Recuperación segura</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Cambia tu contraseña y vuelve a entrar con tranquilidad.</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Este paso completa el flujo de recuperación enviado por correo desde Supabase Auth.
          </p>
          {!supabaseReady ? (
            <NoticeBanner
              title="Supabase no está configurado"
              description="Completa `NEXT_PUBLIC_SUPABASE_URL` y tu llave pública antes de usar el flujo de recuperación."
              tone="error"
            />
          ) : null}
        </div>

        {supabaseReady ? <UpdatePasswordPanel /> : null}
      </SectionCard>
    </AuthPageFrame>
  );
}
