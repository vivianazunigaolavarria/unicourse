import { adminCourseOutline, adminNavigation } from "@/content/copy/es-mx";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function AdminCoursesPage() {
  return (
    <AppShell
      badge="Administración"
      title="Cursos"
      description="Editor inicial del curso con estructura, estados y vista previa en español."
      navItems={adminNavigation}
    >
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-3">
            <StatusChip tone="violet">Editor de curso</StatusChip>
            <h1 className="font-heading text-5xl leading-tight">IA desde cero</h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
              Esta vista es la base del Course Builder. El siguiente paso será reemplazar el demo
              fixture por tablas reales y formularios conectados a Supabase.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="uc-button-secondary" type="button">
              Guardar borrador
            </button>
            <button className="uc-button-primary" type="button">
              Publicar curso
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <SectionCard className="grid gap-3">
          <h2 className="font-heading text-3xl">Estructura</h2>
          <div className="grid gap-3">
            {adminCourseOutline.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-[var(--uc-border)] p-4">
                <StatusChip
                  tone={item.status === "Publicado" ? "teal" : item.status === "Editando" ? "violet" : "amber"}
                >
                  {item.status}
                </StatusChip>
                <h3 className="mt-3 font-heading text-2xl">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-3xl">Vista previa de lección</h2>
            <StatusChip tone="teal">En español desde el origen</StatusChip>
          </div>
          <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,var(--uc-cream),#fff)] p-5">
            <div className="rounded-[20px] border border-[rgba(107,92,224,0.12)] bg-white p-4">
              <StatusChip tone="violet">Texto</StatusChip>
              <h3 className="mt-3 font-heading text-2xl">Qué vas a lograr hoy</h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                Aprenderás a redactar prompts útiles para responder mejor a tus clientas.
              </p>
            </div>
            <div className="rounded-[20px] border border-[rgba(107,92,224,0.12)] bg-white p-4">
              <StatusChip tone="teal">Video</StatusChip>
              <h3 className="mt-3 font-heading text-2xl">Ejemplo guiado</h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                Video corto con explicación paso a paso y ejemplo aplicado a un negocio real.
              </p>
            </div>
            <div className="rounded-[20px] border border-[rgba(107,92,224,0.12)] bg-white p-4">
              <StatusChip tone="amber">Material descargable</StatusChip>
              <h3 className="mt-3 font-heading text-2xl">Guía rápida en PDF</h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--uc-muted)]">
                Plantillas listas para adaptar a distintos tipos de atención al cliente.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

