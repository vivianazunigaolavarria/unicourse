import Link from "next/link";

import { publicNavigation } from "@/content/copy/es-mx";
import { SignOutForm } from "@/components/auth/sign-out-form";
import { Logo } from "@/components/layout/logo";
import { getOptionalViewer } from "@/lib/auth";
import { getDashboardPathForRole } from "@/lib/profile";

export async function PublicHeader() {
  const viewer = await getOptionalViewer();

  return (
    <header className="uc-surface sticky top-0 z-20 mx-auto mt-5 flex w-full max-w-7xl items-center justify-between gap-6 rounded-[28px] px-5 py-4">
      <Logo />
      <nav className="hidden items-center gap-2 md:flex">
        {publicNavigation.map((item) => (
          <Link
            key={item.href}
            className="rounded-full px-4 py-2 text-sm text-[var(--uc-ink)] transition hover:bg-[rgba(107,92,224,0.08)] hover:text-[var(--uc-violet)]"
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {viewer ? (
        <div className="hidden items-center gap-3 md:flex">
          <Link className="uc-button-primary" href={getDashboardPathForRole(viewer.role)}>
            Ir a mi panel
          </Link>
          <SignOutForm label="Salir" />
        </div>
      ) : (
        <Link className="uc-button-primary hidden md:inline-flex" href="/iniciar-sesion">
          Entrar
        </Link>
      )}
    </header>
  );
}
