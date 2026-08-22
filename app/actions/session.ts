"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { withQuery } from "@/lib/urls";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withQuery("/iniciar-sesion", { notice: "session-closed" }));
}
