import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { normalizeInternalPath, withQuery } from "@/lib/urls";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextPath = normalizeInternalPath(searchParams.get("next"), "/mis-cursos");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(withQuery("/iniciar-sesion", { notice: "auth-link-invalid" }), origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "recovery" | "email" | "invite" | "email_change",
  });

  if (error) {
    return NextResponse.redirect(new URL(withQuery("/iniciar-sesion", { notice: "auth-link-invalid" }), origin));
  }

  const notice = type === "recovery" ? null : "email-confirmed";
  return NextResponse.redirect(new URL(withQuery(nextPath, { notice }), origin));
}
