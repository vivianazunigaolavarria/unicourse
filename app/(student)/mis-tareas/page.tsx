import { studentNavigation, studentTasks } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function StudentTasksPage() {
  return (
    <AppShell
      badge="Portal de alumna"
      title="Mis tareas"
      description="Estados claros, fechas visibles y lenguaje tranquilizador para evitar dudas al momento de entregar."
      navItems={studentNavigation}
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="amber">Entrega clara y sin fricción</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Aquí verás exactamente qué tienes pendiente y qué ya fue revisado.</h1>
      </SectionCard>

      <div className="grid gap-4">
        {studentTasks.map((task) => (
          <SectionCard key={task.title} className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={task.status === "Pendiente" ? "amber" : "teal"}>{task.status}</StatusChip>
              <span className="text-sm text-[var(--uc-muted)]">Fecha de entrega: {task.dueDate}</span>
            </div>
            <h2 className="font-heading text-3xl">{task.title}</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">{task.summary}</p>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}

