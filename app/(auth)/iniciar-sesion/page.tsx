import { LockKeyhole, Mail } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl place-items-center px-4 py-10">
      <SectionCard className="grid w-full max-w-5xl gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-10">
        <div className="grid gap-5">
          <StatusChip tone="violet">Autenticación preparada para Supabase Auth</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Entra a UniCourse con claridad desde el primer paso.</h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--uc-muted)]">
            La conexión real de correo, recuperación de contraseña y sesión segura entra en el
            siguiente milestone, pero la ruta y la experiencia ya están listas para recibirla.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,252,0.96))] p-6">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Correo electrónico
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--uc-border)] bg-white px-4 py-3">
                <Mail className="h-4 w-4 text-[var(--uc-muted)]" />
                <input
                  className="w-full bg-transparent text-[var(--uc-ink)] outline-none"
                  defaultValue="ana@ejemplo.com"
                  type="email"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Contraseña
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--uc-border)] bg-white px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-[var(--uc-muted)]" />
                <input className="w-full bg-transparent text-[var(--uc-ink)] outline-none" defaultValue="••••••••" type="password" />
              </div>
            </label>

            <button className="uc-button-primary mt-2 justify-center" type="button">
              Iniciar sesión
            </button>
            <button className="uc-button-secondary justify-center" type="button">
              Olvidé mi contraseña
            </button>
          </form>
        </div>
      </SectionCard>
    </main>
  );
}

