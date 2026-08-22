import type { ReactNode } from "react";

import { StudentShell } from "@/components/student/student-shell";
import { getStudentNavigation } from "@/content/copy/es-mx";
import { requireAuthenticatedViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const viewer = await requireAuthenticatedViewer("/dashboard");

  return (
    <StudentShell navigation={getStudentNavigation(viewer.role)} viewer={viewer}>
      {children}
    </StudentShell>
  );
}
