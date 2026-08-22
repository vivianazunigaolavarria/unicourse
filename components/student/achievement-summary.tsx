import { SectionCard } from "@/components/ui/section-card";

type AchievementSummaryProps = {
  completedLessons: number;
  completedCourses: number;
  submittedAssignments: number;
  certificates: number;
};

export function AchievementSummary({
  completedLessons,
  completedCourses,
  submittedAssignments,
  certificates,
}: AchievementSummaryProps) {
  const achievements: Array<{ title: string; detail: string }> = [];

  if (completedCourses >= 1) {
    achievements.push({
      title: completedCourses === 1 ? "Primer curso terminado" : `${completedCourses} cursos terminados`,
      detail: "Tus cierres completados quedarán registrados aquí.",
    });
  }

  if (completedLessons >= 1) {
    achievements.push({
      title: `${completedLessons} lecciones completadas`,
      detail: "Cada lección terminada fortalece tu avance real.",
    });
  }

  if (submittedAssignments >= 1) {
    achievements.push({
      title: submittedAssignments === 1 ? "Primera tarea entregada" : `${submittedAssignments} tareas entregadas`,
      detail: "Tus entregas revisables ya empiezan a construir historial.",
    });
  }

  if (certificates >= 1) {
    achievements.push({
      title: certificates === 1 ? "1 certificado emitido" : `${certificates} certificados emitidos`,
      detail: "Tus certificados aparecerán aquí cuando el sistema los genere.",
    });
  }

  return (
    <SectionCard className="grid gap-5 rounded-[28px] p-6">
      <div className="grid gap-2">
        <p className="uc-kicker">Logros y certificados</p>
        <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Tu recorrido también se celebra</h2>
        <p className="max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">
          Este espacio está listo para crecer con hitos reales, sin convertir UniCourse en una plataforma infantil.
        </p>
      </div>

      {achievements.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[rgba(107,92,224,0.2)] bg-[rgba(255,255,255,0.72)] p-5">
          <p className="text-base font-medium text-[var(--uc-ink)]">Tus logros aparecerán aquí mientras avanzas.</p>
          <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
            Cuando completes lecciones, tareas o cursos, esta sección empezará a llenarse con tus propios hitos.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <div key={achievement.title} className="rounded-[24px] border border-[var(--uc-border)] bg-white/80 p-4">
              <p className="font-heading text-2xl text-[var(--uc-ink)]">{achievement.title}</p>
              <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">{achievement.detail}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
