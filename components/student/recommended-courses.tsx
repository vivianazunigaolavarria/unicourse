import { Clock3, Sparkles } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";
import type { StudentRecommendedCourse } from "@/lib/data/student";
import { formatDifficultyLabel } from "@/lib/labels";

type RecommendedCoursesProps = {
  courses: StudentRecommendedCourse[];
};

export function RecommendedCourses({ courses }: RecommendedCoursesProps) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <SectionCard className="grid gap-5 rounded-[28px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <p className="uc-kicker">Descubre nuevos cursos</p>
          <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Recomendado para ti</h2>
          <p className="max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">
            Estas sugerencias usan cursos reales ya publicados. Aún no hay un algoritmo; sólo mostramos opciones disponibles.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {courses.map((course, index) => (
          <div key={course.id} className="grid gap-4 rounded-[24px] border border-[var(--uc-border)] bg-white/82 p-4">
            <div
              className="flex min-h-[6.5rem] items-start justify-between rounded-[22px] px-4 py-4 text-white"
              style={{
                background:
                  index % 3 === 0
                    ? "linear-gradient(135deg, rgba(201,166,242,0.95), rgba(127,223,201,0.95))"
                    : index % 3 === 1
                      ? "linear-gradient(135deg, rgba(245,201,138,0.95), rgba(201,166,242,0.9))"
                      : "linear-gradient(135deg, rgba(127,223,201,0.95), rgba(245,201,138,0.95))",
              }}
            >
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--uc-ink)]">
                {formatDifficultyLabel(course.difficulty)}
              </span>
              <Sparkles className="h-5 w-5 text-white/90" />
            </div>

            <div className="grid gap-2">
              <h3 className="font-heading text-2xl text-[var(--uc-ink)]">{course.title}</h3>
              <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
                {course.short_description?.trim() || "Curso publicado listo para integrarse a esta experiencia."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--uc-muted)]">
              {course.estimated_duration_minutes ? (
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[var(--uc-violet)]" />
                  {Math.max(1, Math.round(course.estimated_duration_minutes / 60))} h aprox.
                </span>
              ) : null}
              <span>{course.enrolledStudentsCount} inscritas</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
