import { redirect } from "next/navigation";

import { requireAuthenticatedViewer } from "@/lib/auth";

export default async function StudentClassesPage() {
  await requireAuthenticatedViewer("/perfil");
  redirect("/perfil");
}
