import Link from "next/link";

import { PublicWordmark } from "@/components/layout/public-wordmark";

export function PublicHeader() {
  return (
    <header className="relative z-10 flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 lg:py-8">
      <PublicWordmark />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <Link className="uc-button-secondary sm:min-w-[10rem]" href="/iniciar-sesion">
          Iniciar sesión
        </Link>
        <Link className="uc-button-primary sm:min-w-[11.5rem]" href="/iniciar-sesion">
          Crear mi cuenta
        </Link>
      </div>
    </header>
  );
}
