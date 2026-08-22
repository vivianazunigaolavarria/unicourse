import Link from "next/link";

import { ArrowRight, BookOpenText } from "lucide-react";

import type { StudentEnrollmentProgress } from "@/lib/data/student";

type CourseProgressCardProps = {
  enrollment: StudentEnrollmentProgress;
};

function getProgressWidth(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function CourseProgressCard({ enrollment }: CourseProgressCardProps) {
  const moduleLabel =
    enrollment.totalModuleCount > 0 && enrollment.currentModuleIndex
      ? `Módulo ${enrollment.currentModuleIndex} de ${enrollment.totalModuleCount}`
      : enrollment.totalLessons > 0
        ? `${enrollment.completedLessons} de ${enrollment.totalLessons} lecciones completadas`
        : "Tu ruta de estudio estará disponible pronto";

  const secondaryLabel =
    enrollment.currentModuleTitle ??
    (enrollment.cohorts?.name ? `Cohorte ${enrollment.cohorts.name}` : "Avanza a tu ritmo dentro de UniCourse");

  return (
    <div className="grid gap-5 rounded-[26px] border border-[var(--uc-border)] bg-white/84 p-5 shadow-[0_20px_40px_rgba(58,37,105,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(107,92,224,0.14),rgba(201,166,242,0.18))] text-[var(--uc-violet)]">
          <BookOpenText className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-[rgba(107,92,224,0.08)] px-3 py-1 text-xs font-medium text-[var(--uc-violet)]">
          {enrollment.progressPercentage}% completado
        </span>
      </div>

      <div className="grid gap-2">
        <h3 className="font-heading text-2xl text-[var(--uc-ink)]">{enrollment.courses?.title ?? "Curso en UniCourse"}</h3>
        <p className="text-sm font-medium text-[var(--uc-muted)]">{moduleLabel}</p>
        <p className="text-sm leading-6 text-[var(--uc-muted)]">{secondaryLabel}</p>
      </div>

      <div className="grid gap-3">
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(107,92,224,0.12)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--uc-violet),rgba(127,223,201,0.9))]"
            style={{ width: getProgressWidth(enrollment.progressPercentage) }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm leading-6 text-[var(--uc-muted)]">
            {enrollment.totalLessons > 0
              ? `${enrollment.completedLessons} de ${enrollment.totalLessons} lecciones listas`
              : "Seguiremos llenando esta ruta con contenido real."}
          </p>
          <Link href="/mis-cursos" className="uc-button-primary min-w-[9.5rem] justify-center">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
