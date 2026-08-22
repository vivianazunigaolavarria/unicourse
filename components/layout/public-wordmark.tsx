import Link from "next/link";

export function PublicWordmark() {
  return (
    <Link
      className="inline-flex min-h-[4.25rem] min-w-[12.5rem] items-center rounded-full border border-[rgba(95,63,83,0.16)] bg-[rgba(255,250,246,0.78)] px-5 py-3 shadow-[0_14px_38px_rgba(71,38,57,0.07)] backdrop-blur-sm transition hover:border-[rgba(95,63,83,0.26)]"
      href="/"
    >
      <span className="font-heading text-[2rem] leading-none tracking-[0.08em] text-[var(--uc-ink)] sm:text-[2.15rem]">
        UniCourse
      </span>
    </Link>
  );
}
