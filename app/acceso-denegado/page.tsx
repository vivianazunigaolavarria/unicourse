import Link from "next/link";

import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-4 py-10">
      <SectionCard className="grid gap-5 rounded-[34px] p-8 text-center lg:p-10">
        <div className="mx-auto h-20 w-20 rounded-full border border-[rgba(224,149,74,0.18)] bg-[rgba(224,149,74,0.12)]" />
        <div className="grid gap-3">
          <StatusChip tone="amber">Acceso restringido</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Esta sección no está disponible para tu cuenta.</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Si crees que necesitas permisos administrativos, la propietaria de la plataforma puede
            revisar tu rol desde el panel de UniCourse.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="uc-button-primary" href="/dashboard">
            Ir a mi dashboard
          </Link>
          <Link className="uc-button-secondary" href="/">
            Volver al inicio
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}
