import { redirect } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { withQuery } from "@/lib/urls";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const code = readSearchParam(params.code);
  const flowId = readSearchParam(params.sb_flow_id);
  const error = readSearchParam(params.error);
  const errorCode = readSearchParam(params.error_code);

  if (code || error || errorCode) {
    redirect(
      withQuery("/auth/callback", {
        code,
        sb_flow_id: flowId,
        error,
        error_code: errorCode,
      }),
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-4rem] top-[-1rem] h-[19rem] w-[26rem] opacity-70">
          <span className="absolute left-[12%] top-[18%] h-px w-[74%] rotate-[-16deg] bg-[rgba(107,92,224,0.16)]" />
          <span className="absolute left-[34%] top-[9%] h-px w-[54%] rotate-[16deg] bg-[rgba(127,223,201,0.22)]" />
          <span className="absolute left-[52%] top-[18%] h-px w-[32%] rotate-[72deg] bg-[rgba(224,149,74,0.18)]" />
          <span className="absolute left-[13%] top-[16%] h-4 w-4 rounded-full bg-[rgba(201,166,242,0.88)]" />
          <span className="absolute left-[68%] top-[0%] h-4 w-4 rounded-full bg-[rgba(127,223,201,0.3)]" />
          <span className="absolute left-[92%] top-[14%] h-4 w-4 rounded-full bg-[rgba(224,149,74,0.26)]" />
          <span className="absolute left-[59%] top-[63%] h-4 w-4 rounded-full bg-[rgba(127,223,201,0.28)]" />
          <span className="absolute left-[89%] top-[86%] h-5 w-5 rounded-full bg-[rgba(224,149,74,0.22)]" />
        </div>

        <div className="absolute bottom-[-2rem] left-[-2rem] h-[18rem] w-[22rem] opacity-65">
          <span className="absolute left-[4%] top-[18%] h-px w-[42%] rotate-[74deg] bg-[rgba(127,223,201,0.24)]" />
          <span className="absolute left-[30%] top-[76%] h-px w-[42%] rotate-[-32deg] bg-[rgba(107,92,224,0.18)]" />
          <span className="absolute left-[56%] top-[80%] h-px w-[28%] rotate-[18deg] bg-[rgba(127,223,201,0.2)]" />
          <span className="absolute left-[8%] top-[8%] h-4 w-4 rounded-full bg-[rgba(127,223,201,0.28)]" />
          <span className="absolute left-[63%] top-[34%] h-5 w-5 rounded-full bg-[rgba(201,166,242,0.72)]" />
          <span className="absolute left-[86%] top-[64%] h-5 w-5 rounded-full bg-[rgba(127,223,201,0.26)]" />
        </div>
      </div>

      <PublicHeader />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-7xl flex-col items-center justify-center px-4 pb-14 pt-8 sm:px-6 sm:pb-18 lg:px-8 lg:pt-12">
        <section className="flex w-full max-w-5xl flex-col items-center text-center">
          <h1 className="mt-10 max-w-5xl font-heading text-[clamp(3.4rem,8vw,5.8rem)] leading-[1.02] tracking-[-0.03em] text-[var(--uc-ink)]">
            La tecnología también es para ti.
          </h1>

          <div className="mt-8 uc-divider" aria-hidden="true" />

          <p className="mt-10 max-w-5xl text-[1.45rem] leading-[1.65] text-[var(--uc-muted)] sm:text-[1.6rem]">
            Aprende IA y herramientas digitales para trabajar mejor, ahorrar tiempo, crear y
            cuidar a tu familia en un mundo cada vez más tecnológico.
          </p>

          <p className="mt-10 max-w-5xl text-[1.4rem] font-semibold leading-[1.6] text-[var(--uc-ink)] sm:text-[1.52rem]">
            Clases en vivo con expertos de la industria, práctica real y material para seguir
            aprendiendo a tu ritmo.
          </p>

          <p className="mt-8 max-w-4xl text-[1.15rem] leading-[1.8] text-[var(--uc-muted)] sm:text-[1.24rem]">
            No importa si empiezas desde cero. Aquí aprendemos juntas.
          </p>
        </section>
      </main>
    </div>
  );
}
