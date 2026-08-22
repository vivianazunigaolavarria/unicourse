import Link from "next/link";

import { ArrowRight, CircleCheck, ClipboardList, Clock3 } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";
import type { StudentAssignmentSummary } from "@/lib/data/student";
import { formatDate } from "@/lib/labels";

type PendingAssignmentsProps = {
  assignments: StudentAssignmentSummary[];
};

function getStatusCopy(status: StudentAssignmentSummary["studentStatus"]) {
  switch (status) {
    case "reviewed":
      return {
        label: "Revisada",
        tone: "bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]",
      };
    case "submitted":
      return {
        label: "Entregada",
        tone: "bg-[rgba(224,149,74,0.14)] text-[var(--uc-amber)]",
      };
    default:
      return {
        label: "Pendiente",
        tone: "bg-[rgba(107,92,224,0.1)] text-[var(--uc-violet)]",
      };
  }
}

export function PendingAssignments({ assignments }: PendingAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <SectionCard className="grid gap-4 rounded-[28px] p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(107,92,224,0.1)] text-[var(--uc-violet)]">
            <CircleCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="uc-kicker">Tareas pendientes</p>
            <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">Todo al día por ahora.</h2>
          </div>
        </div>
        <p className="max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">
          Cuando tengas una entrega activa o una profesora te pida una revisión nueva, aparecerá aquí.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="grid gap-5 rounded-[28px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(107,92,224,0.1)] text-[var(--uc-violet)]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <p className="uc-kicker">Tareas pendientes</p>
            <h2 className="mt-2 font-heading text-3xl text-[var(--uc-ink)]">Tus próximos pasos</h2>
          </div>
        </div>

        <Link href="/mis-tareas" className="text-sm font-medium text-[var(--uc-violet)]">
          Ver todas
        </Link>
      </div>

      <div className="grid gap-3">
        {assignments.map((assignment) => {
          const status = getStatusCopy(assignment.studentStatus);

          return (
            <div key={assignment.id} className="grid gap-4 rounded-[24px] border border-[var(--uc-border)] bg-white/80 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={["rounded-full px-3 py-1 text-xs font-medium", status.tone].join(" ")}>{status.label}</span>
                  <span className="text-sm text-[var(--uc-muted)]">{assignment.course?.title ?? "Curso en UniCourse"}</span>
                </div>
                <h3 className="font-heading text-2xl text-[var(--uc-ink)]">{assignment.title}</h3>
                <div className="flex items-center gap-2 text-sm text-[var(--uc-muted)]">
                  <Clock3 className="h-4 w-4" />
                  <span>{assignment.due_at ? `Fecha límite: ${formatDate(assignment.due_at)}` : "Sin fecha límite por ahora"}</span>
                </div>
              </div>

              <Link href="/mis-tareas" className="uc-button-secondary justify-center">
                Ver tarea
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
