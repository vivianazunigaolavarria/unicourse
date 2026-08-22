import { redirect } from "next/navigation";

import { requireAuthenticatedViewer } from "@/lib/auth";

export default async function StudentCoursesPage() {
  await requireAuthenticatedViewer("/perfil");
  redirect("/perfil");
}
