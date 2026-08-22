import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { normalizeInternalPath, withQuery } from "@/lib/urls";

function resolveNextPath(rawValue: string | null, origin: string, fallback: string) {
  if (!rawValue) {
    return fallback;
  }

  if (rawValue.startsWith("/")) {
    return normalizeInternalPath(rawValue, fallback);
  }

  try {
    const parsed = new URL(rawValue);

    if (parsed.origin !== origin) {
      return fallback;
    }

    return normalizeInternalPath(`${parsed.pathname}${parsed.search}`, fallback);
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const fallbackPath = type === "recovery" ? "/actualizar-contrasena" : "/dashboard";
  const nextPath = resolveNextPath(searchParams.get("next") ?? searchParams.get("redirect_to"), origin, fallbackPath);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(withQuery("/login", { notice: "auth-link-invalid" }), origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    const lowerError = error.message.toLowerCase();
    const notice = lowerError.includes("expired") ? "otp-expired" : "auth-link-invalid";
    return NextResponse.redirect(new URL(withQuery("/login", { notice }), origin));
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}
