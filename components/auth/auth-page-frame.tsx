import type { ReactNode } from "react";

import { PublicWordmark } from "@/components/layout/public-wordmark";

type AuthPageFrameProps = {
  children: ReactNode;
  topActions?: ReactNode;
};

export function AuthPageFrame({ children, topActions }: AuthPageFrameProps) {
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

      <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 px-2 py-6 sm:flex-row sm:items-start sm:justify-between lg:py-8">
        <PublicWordmark />
        {topActions ? <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:flex-wrap sm:justify-end">{topActions}</div> : null}
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-7xl items-center justify-center px-2 pb-14 pt-6 sm:pb-18 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
