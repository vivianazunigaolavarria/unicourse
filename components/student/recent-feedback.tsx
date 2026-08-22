import Link from "next/link";

import { MessageSquareText } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";
import type { StudentAssignmentSummary } from "@/lib/data/student";
import { formatDate } from "@/lib/labels";

type RecentFeedbackProps = {
  items: StudentAssignmentSummary[];
};

export function RecentFeedback({ items }: RecentFeedbackProps) {
  if (items.length === 0) {
    return (
      <SectionCard className="grid gap-4 rounded-[28px] p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]">
            <MessageSquareText className="h-5 w-5" />
          </span>
          <div>
            <p className="uc-kicker">Feedback reciente</p>
            <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">Aún no tienes revisiones nuevas.</h2>
          </div>
        </div>
        <p className="max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">
          Cuando una profesora revise tus tareas, encontrarás aquí sus comentarios más recientes.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="grid gap-5 rounded-[28px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]">
            <MessageSquareText className="h-5 w-5" />
          </span>
          <div>
            <p className="uc-kicker">Feedback reciente</p>
            <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">Comentarios para seguir mejor</h2>
          </div>
        </div>

        <Link href="/mis-tareas" className="text-sm font-medium text-[var(--uc-violet)]">
          Ver feedback
        </Link>
      </div>

      <div className="grid gap-3">
        {items.map((assignment) => (
          <div key={assignment.id} className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-white/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[rgba(47,169,143,0.12)] px-3 py-1 text-xs font-medium text-[var(--uc-teal)]">Revisado</span>
              <span className="text-sm text-[var(--uc-muted)]">{assignment.course?.title ?? "Curso en UniCourse"}</span>
            </div>
            <h3 className="font-heading text-2xl text-[var(--uc-ink)]">{assignment.title}</h3>
            <p className="text-sm text-[var(--uc-muted)]">
              {assignment.submission?.reviewed_at ? `Revisado el ${formatDate(assignment.submission.reviewed_at)}` : "Revisión reciente"}
            </p>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
              {assignment.submission?.instructor_feedback?.trim() || "Tu profesora ya dejó observaciones para ayudarte a avanzar con más claridad."}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
