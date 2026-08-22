import { liveClasses, studentNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function StudentClassesPage() {
  return (
    <AppShell
      badge="Portal de alumna"
      title="Mis clases"
      description="Próximas sesiones con horario claro, profesora visible y acceso simple."
      navItems={studentNavigation}
    >
      <SectionCard className="grid gap-4 rounded-[34px] p-8">
        <StatusChip tone="teal">Clases en vivo</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Entrar a tu sesión debería sentirse obvio, no técnico.</h1>
      </SectionCard>

      <div className="grid gap-4">
        {liveClasses.map((item) => (
          <SectionCard key={item.title} className="grid gap-3">
            <StatusChip tone="teal">Clase programada</StatusChip>
            <h2 className="font-heading text-3xl">{item.title}</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">{item.date}</p>
            <p className="text-sm text-[var(--uc-muted)]">Profesora: {item.teacher}</p>
            <button className="uc-button-primary justify-center sm:justify-start" type="button">
              {item.action}
            </button>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}

