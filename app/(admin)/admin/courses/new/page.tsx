import { createCourseAction } from "@/app/(admin)/admin/actions";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function NewCoursePage() {
  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">Nuevo curso</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Crear el shell de un curso nuevo dentro del repo y del schema actual.</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
          Este paso registra el curso como borrador, deja su slug listo y crea una entrada auditada para el panel administrativo.
        </p>
      </SectionCard>

      <SectionCard className="grid gap-4">
        <form action={createCourseAction} className="grid gap-4">
          <input name="return_to" type="hidden" value="/admin/courses" />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Título del curso
              <input className="uc-input" name="title" placeholder="IA desde cero" required type="text" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Slug
              <input className="uc-input" name="slug" placeholder="Se autogenera si lo dejas vacío" type="text" />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Descripción corta
            <textarea className="uc-textarea" name="short_description" placeholder="Resumen breve para cards y listados." rows={3} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Descripción completa
            <textarea className="uc-textarea" name="full_description" placeholder="Texto base para la página del curso." rows={6} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Nivel
            <select className="uc-input" defaultValue="all_levels" name="difficulty">
              <option value="all_levels">Todos los niveles</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </label>

          <div className="flex justify-end">
            <button className="uc-button-primary" type="submit">
              Guardar borrador
            </button>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
