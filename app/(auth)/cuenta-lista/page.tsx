import Link from "next/link";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function AccountReadyPage() {
  return (
    <AuthPageFrame>
      <SectionCard className="grid w-full max-w-3xl gap-6 rounded-[34px] p-8 text-center lg:p-10">
        <StatusChip tone="teal">Cuenta confirmada</StatusChip>
        <div className="grid gap-3">
          <h1 className="font-heading text-5xl leading-tight">¡Tu cuenta está lista!</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">Ya puedes entrar a UniCourse.</p>
        </div>

        <div className="flex justify-center">
          <Link className="uc-button-primary min-w-[16rem] justify-center" href="/login">
            Iniciar sesión
          </Link>
        </div>
      </SectionCard>
    </AuthPageFrame>
  );
}
