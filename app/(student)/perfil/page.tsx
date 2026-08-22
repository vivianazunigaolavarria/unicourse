import { studentNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function ProfilePage() {
  return (
    <AppShell
      badge="Portal de alumna"
      title="Mi perfil"
      description="La alumna debe poder ubicarse y revisar su información sin perderse entre menús."
      navItems={studentNavigation}
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4">
          <StatusChip tone="violet">Perfil de aprendizaje</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Ana Pérez</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Cohorte Agosto 2026 · Curso principal: IA desde cero.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Progreso general</p>
            <p className="mt-3 font-heading text-4xl">62%</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Estado</p>
            <p className="mt-3 text-lg text-[var(--uc-ink)]">Activa</p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}

