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
  cardClassName: string;
  bubbleClassName: string;
  valueClassName: string;
}> = [
  {
    key: "completedLessons",
    label: "Lecciones completadas",
    helper: "Todo lo aprendido se suma a tu recorrido histórico.",
    cardClassName:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(242,236,252,0.96))]",
    bubbleClassName:
      "bg-[radial-gradient(circle,rgba(107,92,224,0.22),rgba(201,166,242,0.08)_58%,transparent_72%)]",
    valueClassName: "text-[var(--uc-violet)]",
  },
  {
    key: "completedCourses",
    label: "Cursos terminados",
    helper: "Tus cierres se guardan aquí como parte de tu avance real.",
    cardClassName:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,238,252,0.94))]",
    bubbleClassName:
      "bg-[radial-gradient(circle,rgba(201,166,242,0.26),rgba(107,92,224,0.08)_56%,transparent_72%)]",
    valueClassName: "text-[var(--uc-violet)]",
  },
  {
    key: "submittedAssignments",
    label: "Tareas entregadas",
    helper: "Incluye entregas pendientes de revisión y ya revisadas.",
    cardClassName:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,244,252,0.94))]",
    bubbleClassName:
      "bg-[radial-gradient(circle,rgba(127,223,201,0.22),rgba(107,92,224,0.08)_58%,transparent_72%)]",
    valueClassName: "text-[var(--uc-violet)]",
  },
  {
    key: "certificates",
    label: "Certificados",
    helper: "Aparecerán aquí en cuanto queden emitidos oficialmente.",
    cardClassName:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,241,252,0.96))]",
    bubbleClassName:
      "bg-[radial-gradient(circle,rgba(224,149,74,0.18),rgba(201,166,242,0.1)_54%,transparent_72%)]",
    valueClassName: "text-[var(--uc-violet)]",
  },
];

export function ProgressSummary({ completedLessons, completedCourses, submittedAssignments, certificates }: ProgressSummaryProps) {
  const values = { completedLessons, completedCourses, submittedAssignments, certificates };

  return (
    <SectionCard className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,252,0.94))] p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute right-[-2rem] top-[-2rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(201,166,242,0.42),rgba(201,166,242,0.08)_58%,transparent_74%)]" />
        <span className="absolute left-[-2.5rem] top-[8.5rem] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(107,92,224,0.16),rgba(107,92,224,0.06)_56%,transparent_74%)]" />
      </div>

      <div className="relative z-10 grid gap-4">
        <h2 className="font-heading text-[clamp(2.3rem,4.2vw,3.8rem)] leading-[1.04] tracking-[-0.03em] text-[var(--uc-ink)]">
          Mi progreso
        </h2>
        <p className="max-w-3xl text-[15px] leading-8 text-[var(--uc-muted)] sm:text-lg">
          Aquí se resume todo lo que has logrado dentro de UniCourse con datos reales, para que veas tu avance histórico
          con claridad.
        </p>
      </div>

      <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-2">
        {metricCards.map((metric) => (
          <div
            key={metric.key}
            className={`relative grid min-h-[220px] gap-6 overflow-hidden rounded-[28px] border border-[var(--uc-border)] p-5 sm:min-h-[236px] sm:p-6 ${metric.cardClassName}`}
          >
            <span className={`pointer-events-none absolute right-[-1.5rem] top-[-1.25rem] h-24 w-24 rounded-full ${metric.bubbleClassName}`} />
            <span className="pointer-events-none absolute bottom-[-1.75rem] left-[-1.25rem] h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.42),transparent_72%)]" />

            <div className="relative z-10 grid gap-4">
              <p className="max-w-[18ch] text-[0.82rem] font-semibold uppercase leading-6 tracking-[0.18em] text-[var(--uc-muted)] sm:text-[0.86rem]">
                {metric.label}
              </p>
              <p className={`font-heading text-6xl leading-none sm:text-[4.2rem] ${metric.valueClassName}`}>{values[metric.key]}</p>
            </div>

            <p className="relative z-10 max-w-[32ch] text-[1.02rem] leading-7 text-[var(--uc-muted)] sm:text-lg sm:leading-8">
              {metric.helper}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
