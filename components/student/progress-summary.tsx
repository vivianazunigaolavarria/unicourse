import { SectionCard } from "@/components/ui/section-card";

type ProgressSummaryProps = {
  completedLessons: number;
  completedCourses: number;
  submittedAssignments: number;
  certificates: number;
};

const metricCards: Array<{
  key: keyof ProgressSummaryProps;
  label: string;
  helper: string;
}> = [
  {
    key: "completedLessons",
    label: "Lecciones completadas",
    helper: "Cada avance suma a tu recorrido.",
  },
  {
    key: "completedCourses",
    label: "Cursos terminados",
    helper: "Tus cierres quedarán visibles aquí.",
  },
  {
    key: "submittedAssignments",
    label: "Tareas entregadas",
    helper: "Incluye entregas en revisión y revisadas.",
  },
  {
    key: "certificates",
    label: "Certificados",
    helper: "Aparecerán cuando estén emitidos.",
  },
];

export function ProgressSummary({ completedLessons, completedCourses, submittedAssignments, certificates }: ProgressSummaryProps) {
  const values = { completedLessons, completedCourses, submittedAssignments, certificates };

  return (
    <SectionCard className="grid gap-5 rounded-[28px] p-6">
      <div className="grid gap-2">
        <p className="uc-kicker">Mi progreso</p>
        <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Así va tu avance hoy</h2>
        <p className="max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">
          Este bloque ya usa datos reales para resumir lo que has completado dentro de UniCourse.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.key} className="rounded-[24px] border border-[var(--uc-border)] bg-white/80 p-4">
            <p className="uc-kicker">{metric.label}</p>
            <p className="mt-3 font-heading text-4xl text-[var(--uc-ink)]">{values[metric.key]}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">{metric.helper}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
