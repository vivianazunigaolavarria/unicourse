import { adminNavigation, liveClasses, studentCourses, studentNavigation, studentTasks } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function StudentCoursesPage() {
  return (
    <AppShell
      badge="Portal de alumna"
      title="Mis cursos"
      description="La alumna entiende qué sigue, qué ya completó y dónde debe hacer clic para continuar."
      navItems={studentNavigation}
      rightRail={
        <div className="rounded-[24px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.08)] p-4 text-sm text-[var(--uc-muted)]">
          Próxima clase:
          <strong className="mt-2 block text-[var(--uc-ink)]">Martes, 25 de agosto · 7:00 p. m.</strong>
        </div>
      }
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">Continúa donde te quedaste</StatusChip>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="grid gap-4">
            <h1 className="font-heading text-5xl leading-tight">IA desde cero te espera justo en la siguiente lección.</h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
              El objetivo aquí no es que la alumna “aprenda a usar una plataforma”, sino que
              entienda qué hacer ahora mismo.
            </p>
          </div>
          <div className="rounded-[26px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(107,92,224,0.12),rgba(255,255,255,0.98))] p-5">
            <p className="uc-kicker">Progreso actual</p>
            <p className="mt-3 font-heading text-5xl">62%</p>
            <p className="mt-3 text-sm leading-7 text-[var(--uc-muted)]">
              Lección actual: Prompts para atención al cliente.
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="uc-grid-auto">
        {studentCourses.map((course) => (
          <SectionCard key={course.title} className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={course.status === "En progreso" ? "violet" : "amber"}>{course.status}</StatusChip>
              <span className="text-sm text-[var(--uc-muted)]">{course.cohort}</span>
            </div>
            <h2 className="font-heading text-3xl">{course.title}</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">{course.nextStep}</p>
            <div className="overflow-hidden rounded-full bg-[rgba(107,92,224,0.10)]">
              <div className="h-3 rounded-full bg-[linear-gradient(90deg,var(--uc-violet),var(--uc-teal))]" style={{ width: `${course.progress}%` }} />
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-3xl">Mis tareas</h2>
            <StatusChip tone="amber">1 pendiente</StatusChip>
          </div>
          <div className="grid gap-3">
            {studentTasks.map((task) => (
              <div key={task.title} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={task.status === "Pendiente" ? "amber" : "teal"}>{task.status}</StatusChip>
                  <span className="text-sm text-[var(--uc-muted)]">{task.dueDate}</span>
                </div>
                <h3 className="mt-3 font-heading text-2xl">{task.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">{task.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-3xl">Mis clases</h2>
            <StatusChip tone="teal">Acceso claro</StatusChip>
          </div>
          <div className="grid gap-3">
            {liveClasses.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <h3 className="font-heading text-2xl">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">{item.date}</p>
                <p className="text-sm text-[var(--uc-muted)]">Profesora: {item.teacher}</p>
                <button className="uc-button-secondary mt-4" type="button">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

