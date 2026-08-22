import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Users } from "lucide-react";

import { PublicHeader } from "@/components/layout/public-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { isSupabaseConfigured } from "@/lib/env";

export default function HomePage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="pb-12">
      <PublicHeader />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pt-6">
        <SectionCard className="grid gap-8 rounded-[34px] p-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:p-10">
          <div className="grid gap-5">
            <StatusChip tone="violet">Base de UniCourse lista para crecer</StatusChip>
            <div className="grid gap-4">
              <h1 className="font-heading text-5xl leading-tight text-[var(--uc-ink)]">
                Tu plataforma propia para cursos, alumnas y administración.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
                `unicourse.training` puede vivir fuera de Squarespace por completo. Squarespace se
                queda solo como registrador y DNS; la aplicación la construimos y desplegamos por
                nuestra cuenta.
              </p>
            </div>
            <div className="uc-divider" aria-hidden="true" />
            <div className="flex flex-wrap gap-3">
              <Link className="uc-button-primary" href="/mis-cursos">
                Ver portal de alumna
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="uc-button-secondary" href="/admin">
                Ver panel administrativo
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[26px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(107,92,224,0.10),rgba(255,255,255,0.94))] p-6">
              <p className="uc-kicker">Estado actual</p>
              <h2 className="mt-3 font-heading text-3xl">Milestone 1</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--uc-muted)]">
                Estructura Next.js lista, diseño en español, shells de alumnas y administración, y
                base preparada para conectar Supabase.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusChip tone={supabaseReady ? "teal" : "amber"}>
                  {supabaseReady ? "Supabase configurado" : "Falta conectar Supabase"}
                </StatusChip>
                <StatusChip tone="teal">Squarespace no es el builder</StatusChip>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="uc-grid-auto">
          <SectionCard className="grid gap-4">
            <BookOpen className="h-8 w-8 text-[var(--uc-violet)]" />
            <h2 className="font-heading text-3xl">Editor de cursos</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
              Cursos, módulos, lecciones, materiales y tareas desde una interfaz clara y reusable.
            </p>
          </SectionCard>

          <SectionCard className="grid gap-4">
            <CalendarDays className="h-8 w-8 text-[var(--uc-teal)]" />
            <h2 className="font-heading text-3xl">Portal de alumnas</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
              Continuar donde se quedaron, entrar a clases en vivo, descargar materiales y subir
              entregas con seguridad.
            </p>
          </SectionCard>

          <SectionCard className="grid gap-4">
            <Users className="h-8 w-8 text-[var(--uc-amber)]" />
            <h2 className="font-heading text-3xl">CRM educativo</h2>
            <p className="text-[15px] leading-7 text-[var(--uc-muted)]">
              Progreso, cohortes, etiquetas, notas internas y seguimiento por alumna desde un solo
              lugar.
            </p>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

