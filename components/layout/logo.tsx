import Link from "next/link";

export function Logo() {
  return (
    <Link className="inline-flex items-center gap-3 text-current no-underline" href="/">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--uc-violet),var(--uc-teal))] font-heading text-xl text-white shadow-[0_16px_36px_rgba(107,92,224,0.22)]">
        U
      </span>
      <span className="flex flex-col">
        <span className="font-heading text-xl leading-none text-[var(--uc-ink)]">UniCourse</span>
        <span className="text-sm text-[var(--uc-muted)]">Cursos claros, cálidos y gestionables</span>
      </span>
    </Link>
  );
}

