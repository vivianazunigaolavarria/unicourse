import Link from "next/link";

export function PublicWordmark() {
  return (
    <Link
      className="inline-flex min-h-[7.5rem] min-w-[18rem] flex-col justify-center rounded-[2rem] border-[3px] border-dashed border-[rgba(122,111,144,0.42)] bg-[rgba(255,255,255,0.22)] px-7 py-5 text-current no-underline"
      href="/"
    >
      <span className="font-heading text-[2.9rem] leading-none text-[var(--uc-ink)] sm:text-[3.2rem]">
        Unicourse
      </span>
      <span className="mt-3 text-[0.88rem] font-medium uppercase tracking-[0.18em] text-[var(--uc-muted)] sm:text-[0.96rem]">
        Espacio para logo
      </span>
    </Link>
  );
}
