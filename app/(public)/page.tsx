import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PublicHeader } from "@/components/layout/public-header";

const principles = [
  {
    title: "Desde tu nivel",
    description:
      "Puedes empezar desde cero o llegar con experiencia. El punto no es impresionar a nadie, sino aprender con claridad.",
  },
  {
    title: "Sin lenguaje innecesario",
    description:
      "Explicamos inteligencia artificial y herramientas digitales sin volverlas intimidantes ni llenarlas de tecnicismos vacíos.",
  },
  {
    title: "Para la vida real",
    description:
      "Cada paso está pensado para ayudarte a trabajar mejor, organizar tu vida, crear, investigar y moverte con más seguridad.",
  },
];

export default function HomePage() {
  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto min-h-[calc(100vh-2rem)] max-w-[1440px] overflow-hidden rounded-[34px] border border-[var(--uc-line)] bg-[linear-gradient(180deg,rgba(255,251,248,0.95),rgba(247,239,244,0.92))] shadow-[0_30px_120px_rgba(71,38,57,0.12)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-5rem] top-[7rem] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,rgba(216,192,208,0.78),transparent_70%)] blur-3xl" />
          <div className="absolute right-[-4rem] top-[10rem] h-[14rem] w-[14rem] rounded-full bg-[radial-gradient(circle,rgba(197,161,115,0.2),transparent_72%)] blur-3xl" />
          <div className="absolute bottom-[-5rem] right-[10%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(180,210,207,0.38),transparent_72%)] blur-3xl" />
          <div className="absolute inset-x-[8%] top-[7.5rem] h-px bg-[linear-gradient(90deg,transparent,rgba(95,63,83,0.2),transparent)]" />
        </div>

        <PublicHeader />

        <main className="relative z-10 px-6 pb-8 sm:px-8 lg:px-12 lg:pb-12">
          <section className="grid gap-12 border-t border-[var(--uc-line)] py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.82fr)] lg:items-end lg:py-16">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--uc-muted)]">
                Inteligencia artificial y herramientas digitales con claridad, criterio y calma.
              </p>

              <h1 className="mt-6 max-w-4xl font-heading text-[clamp(3.5rem,8vw,7rem)] leading-[0.92] tracking-[-0.04em] text-[var(--uc-ink)]">
                La tecnología también es para ti.
              </h1>

              <div className="mt-8 max-w-2xl space-y-5 text-[1.02rem] leading-8 text-[var(--uc-muted)] sm:text-[1.06rem]">
                <p>
                  UniCourse es un espacio para aprender inteligencia artificial y herramientas
                  tecnológicas sin importar tu edad ni tu punto de partida. Si vienes desde cero,
                  te acompañamos paso a paso; si ya empezaste a explorar, aquí puedes profundizar
                  con claridad, a tu ritmo y sin tecnicismos innecesarios.
                </p>
                <p>
                  Pensamos en mujeres que sostienen muchas cosas a la vez: mamás, profesionistas,
                  empleadas, emprendedoras, cuidadoras y personas curiosas que quieren usar la
                  tecnología para trabajar mejor, organizar su vida, crear, investigar, proteger a
                  su familia y sentirse más cómodas en un mundo que cambia todos los días.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link className="uc-button-primary" href="/iniciar-sesion">
                  Crear mi cuenta
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link className="uc-button-secondary" href="/iniciar-sesion">
                  Iniciar sesión
                </Link>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--uc-muted)]">
                No necesitas experiencia previa. Puedes empezar exactamente desde donde estás.
              </p>
            </div>

            <aside className="relative">
              <div className="rounded-[30px] border border-[rgba(95,63,83,0.14)] bg-[linear-gradient(180deg,rgba(255,248,242,0.86),rgba(255,255,255,0.72))] p-6 shadow-[0_22px_54px_rgba(71,38,57,0.08)] backdrop-blur-md sm:p-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--uc-amber)]">
                  Una forma más humana de aprender
                </p>

                <div className="mt-6 grid gap-6">
                  {principles.map((item, index) => (
                    <div key={item.title} className="grid gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-2xl leading-none text-[var(--uc-amber)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(182,145,99,0.55),transparent)]" />
                      </div>
                      <div className="grid gap-2">
                        <h2 className="font-heading text-[2rem] leading-tight text-[var(--uc-ink)]">
                          {item.title}
                        </h2>
                        <p className="text-sm leading-7 text-[var(--uc-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-[rgba(95,63,83,0.1)] pt-6">
                  <p className="font-heading text-[2rem] leading-tight text-[var(--uc-ink)]">
                    Aprender tecnología puede sentirse sereno, elegante y útil al mismo tiempo.
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <footer className="flex flex-col gap-3 border-t border-[var(--uc-line)] py-6 text-sm text-[var(--uc-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-heading text-xl text-[var(--uc-ink)]">UniCourse</p>
            <p>Aprender con claridad también es una forma de sentirse acompañada.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
