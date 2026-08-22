import { redirect } from "next/navigation";

import { requireAuthenticatedViewer } from "@/lib/auth";

export default async function StudentTasksPage() {
  await requireAuthenticatedViewer("/perfil");
  redirect("/perfil");
}
