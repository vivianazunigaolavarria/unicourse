import Link from "next/link";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { EmailConfirmationPanel } from "@/components/auth/email-confirmation-panel";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { readSearchParam } from "@/lib/search-params";

type ReviewEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReviewEmailPage({ searchParams }: ReviewEmailPageProps) {
  const params = (await searchParams) ?? {};
  const email = readSearchParam(params.email) ?? null;

  return (
    <AuthPageFrame topActions={<Link className="uc-button-secondary" href="/login">Iniciar sesión</Link>}>
      <SectionCard className="grid w-full max-w-3xl gap-6 rounded-[34px] p-8 text-center lg:p-10">
        <StatusChip tone="violet">Confirmación pendiente</StatusChip>
        <div className="grid gap-3">
          <h1 className="font-heading text-5xl leading-tight">Revisa tu correo 💌</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
            Te enviamos un enlace para confirmar tu cuenta. Cuando lo abras, podrás continuar en UniCourse.
          </p>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[var(--uc-muted)]">
            Si no lo encuentras, revisa tu carpeta de spam o correo no deseado.
          </p>
        </div>

        <EmailConfirmationPanel email={email} />
      </SectionCard>
    </AuthPageFrame>
  );
}
