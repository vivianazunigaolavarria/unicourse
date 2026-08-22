import { adminNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function AdminDashboardPage() {
  return (
    <AppShell
      badge="Administración"
      title="Panel"
      description="Una vista clara para entender cursos, cohortes, alumnas y entregas sin crear un dashboard frío o genérico."
      navItems={adminNavigation}
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="grid gap-4">
          <StatusChip tone="violet">Administración de UniCourse</StatusChip>
          <h1 className="font-heading text-5xl leading-tight">Todo lo importante del programa en una sola vista.</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Esta base ya separa el sitio público del producto autenticado, y deja lista la
            estructura para roles, RLS y datos reales desde Supabase.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Curso principal</p>
            <p className="mt-3 font-heading text-3xl">IA desde cero</p>
          </div>
          <div className="rounded-[22px] border border-[var(--uc-border)] p-4">
            <p className="uc-kicker">Cohorte activa</p>
            <p className="mt-3 text-lg text-[var(--uc-ink)]">Agosto 2026</p>
          </div>
        </div>
      </SectionCard>

      <div className="uc-grid-auto">
        <SectionCard className="grid gap-3">
          <StatusChip tone="violet">Cursos</StatusChip>
          <h2 className="font-heading text-3xl">6 módulos</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Listos para ordenarse, editarse y publicarse.</p>
        </SectionCard>
        <SectionCard className="grid gap-3">
          <StatusChip tone="teal">Alumnas</StatusChip>
          <h2 className="font-heading text-3xl">34 activas</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Con seguimiento, etiquetas y notas internas.</p>
        </SectionCard>
        <SectionCard className="grid gap-3">
          <StatusChip tone="amber">Entregas</StatusChip>
          <h2 className="font-heading text-3xl">5 por revisar</h2>
          <p className="text-[15px] leading-7 text-[var(--uc-muted)]">Pendientes de aprobación o solicitud de cambios.</p>
        </SectionCard>
      </div>
    </AppShell>
  );
}

