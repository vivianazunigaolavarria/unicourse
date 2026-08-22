import Link from "next/link";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

export default function TermsPage() {
  return (
    <AuthPageFrame topActions={<Link className="uc-button-secondary" href="/registro">Volver al registro</Link>}>
      <SectionCard className="grid w-full max-w-4xl gap-6 rounded-[34px] p-8 lg:p-10">
        <StatusChip tone="violet">Documento en preparación</StatusChip>
        <div className="grid gap-3">
          <h1 className="font-heading text-5xl leading-tight">Términos y Condiciones</h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--uc-muted)]">
            Estamos preparando la versión final de este documento para UniCourse. Esta ruta ya quedó conectada para la siguiente fase legal.
          </p>
        </div>
      </SectionCard>
    </AuthPageFrame>
  );
}
