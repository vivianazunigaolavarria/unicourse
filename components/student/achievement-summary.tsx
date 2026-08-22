import { Award } from "lucide-react";

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
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="grid gap-2">
          <p className="uc-kicker">Logros y certificados</p>
          <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Tu recorrido también se celebra</h2>
        </div>

        <div className="relative h-[108px] w-[108px] shrink-0">
          <span className="absolute left-[28px] top-[54px] h-[42px] w-[20px] rounded-b-[16px] bg-[linear-gradient(180deg,rgba(107,92,224,0.96),rgba(201,166,242,0.82))]" />
          <span className="absolute left-[60px] top-[54px] h-[42px] w-[20px] rounded-b-[16px] bg-[linear-gradient(180deg,rgba(47,169,143,0.96),rgba(127,223,201,0.82))]" />
          <div className="absolute inset-x-0 top-0 mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[rgba(107,92,224,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,240,251,0.92))] shadow-[0_18px_34px_rgba(58,37,105,0.14)]">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(107,92,224,0.18),rgba(47,169,143,0.16),rgba(224,149,74,0.2))] text-[var(--uc-violet)]">
              <Award className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="grid gap-4 rounded-[24px] border border-dashed border-[rgba(107,92,224,0.2)] bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(246,240,251,0.76))] p-5 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[24px] border border-[rgba(107,92,224,0.12)] bg-[linear-gradient(135deg,rgba(107,92,224,0.12),rgba(47,169,143,0.12))] text-[var(--uc-violet)] shadow-[0_16px_30px_rgba(58,37,105,0.08)]">
            <Award className="h-10 w-10" />
          </div>
          <div>
            <p className="text-base font-medium text-[var(--uc-ink)]">Tus logros aparecerán aquí mientras avanzas.</p>
            <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
              Cuando completes lecciones, tareas o cursos, esta sección empezará a llenarse con hitos reales de tu recorrido.
            </p>
          </div>
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
