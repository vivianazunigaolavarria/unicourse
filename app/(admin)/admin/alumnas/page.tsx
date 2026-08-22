import { adminNavigation, adminStudents } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function AdminStudentsPage() {
  return (
    <AppShell
      badge="Administración"
      title="Alumnas"
      description="Base del CRM educativo con progreso, cohortes, etiquetas y seguimiento."
      navItems={adminNavigation}
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">CRM educativo</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Abrir el perfil de una alumna debe darte contexto de inmediato.</h1>
      </SectionCard>

      <div className="grid gap-4">
        {adminStudents.map((student) => (
          <SectionCard key={student.name} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip
                  tone={student.status === "Atención" ? "amber" : student.status === "Seguimiento" ? "violet" : "teal"}
                >
                  {student.status}
                </StatusChip>
                <span className="text-sm text-[var(--uc-muted)]">{student.cohort}</span>
              </div>
              <h2 className="font-heading text-3xl">{student.name}</h2>
              <p className="text-[15px] leading-7 text-[var(--uc-muted)]">{student.note}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--uc-border)] bg-[rgba(107,92,224,0.06)] p-5">
              <p className="uc-kicker">Progreso</p>
              <p className="mt-3 font-heading text-4xl">{student.progress}</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}

