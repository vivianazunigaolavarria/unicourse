import type { ReactNode } from "react";

import type { StudentNavigationConfig } from "@/content/copy/es-mx";
import type { ViewerProfile } from "@/lib/profile";

import { StudentNavigation } from "@/components/student/student-navigation";

type StudentShellProps = {
  children: ReactNode;
  navigation: StudentNavigationConfig;
  viewer: Pick<ViewerProfile, "first_name" | "last_name" | "email" | "role">;
};

export function StudentShell({ children, navigation, viewer }: StudentShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-5rem] top-[-2rem] h-[22rem] w-[28rem] opacity-75">
          <span className="absolute left-[18%] top-[18%] h-px w-[64%] rotate-[-14deg] bg-[rgba(107,92,224,0.14)]" />
          <span className="absolute left-[46%] top-[12%] h-px w-[42%] rotate-[28deg] bg-[rgba(127,223,201,0.22)]" />
          <span className="absolute left-[58%] top-[18%] h-px w-[28%] rotate-[76deg] bg-[rgba(224,149,74,0.16)]" />
          <span className="absolute left-[12%] top-[22%] h-4 w-4 rounded-full bg-[rgba(201,166,242,0.72)]" />
          <span className="absolute left-[74%] top-[10%] h-4 w-4 rounded-full bg-[rgba(127,223,201,0.3)]" />
          <span className="absolute left-[86%] top-[42%] h-5 w-5 rounded-full bg-[rgba(224,149,74,0.22)]" />
        </div>

        <div className="absolute bottom-[-3rem] left-[-3rem] h-[18rem] w-[22rem] opacity-65">
          <span className="absolute left-[6%] top-[22%] h-px w-[42%] rotate-[70deg] bg-[rgba(127,223,201,0.22)]" />
          <span className="absolute left-[28%] top-[76%] h-px w-[40%] rotate-[-28deg] bg-[rgba(107,92,224,0.18)]" />
          <span className="absolute left-[54%] top-[82%] h-px w-[24%] rotate-[18deg] bg-[rgba(127,223,201,0.18)]" />
          <span className="absolute left-[10%] top-[12%] h-4 w-4 rounded-full bg-[rgba(127,223,201,0.22)]" />
          <span className="absolute left-[62%] top-[38%] h-5 w-5 rounded-full bg-[rgba(201,166,242,0.7)]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] gap-5 lg:gap-6">
        <StudentNavigation navigation={navigation} viewer={viewer} />
        <main className="min-w-0 flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}
