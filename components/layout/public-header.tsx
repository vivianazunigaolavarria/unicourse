import Link from "next/link";

import { PublicWordmark } from "@/components/layout/public-wordmark";

export function PublicHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-start sm:justify-between lg:px-8 lg:py-8">
      <PublicWordmark />
      <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:flex-wrap sm:justify-end">
        <Link className="uc-button-secondary min-h-[5.5rem] px-8 text-[1.05rem] sm:min-w-[17rem] sm:text-[1.1rem]" href="/iniciar-sesion">
          Iniciar sesión
        </Link>
        <Link className="uc-button-primary min-h-[5.5rem] px-8 text-[1.05rem] sm:min-w-[17rem] sm:text-[1.1rem]" href="/iniciar-sesion">
          Crear mi cuenta
        </Link>
      </div>
    </header>
  );
}
