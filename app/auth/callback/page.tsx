"use client";

import { useEffect, useState } from "react";

import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPathForRole } from "@/lib/profile";
import { toBrowserAppUrl, withQuery } from "@/lib/urls";

type CallbackIntent = "signup" | "recovery";

function getNoticeFromHash(hash: string) {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const errorCode = params.get("error_code");
  const error = params.get("error");

  if (errorCode === "otp_expired") {
    return "otp-expired";
  }

  if (error === "access_denied") {
    return "auth-access-denied";
  }

  return "auth-link-invalid";
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Estamos validando tu acceso...");

  useEffect(() => {
    const supabase = createClient();

    async function finishAuth() {
      const redirectTo = (path: string) => {
        window.location.replace(toBrowserAppUrl(path));
      };
      const url = new URL(window.location.href);
      const intent = (url.searchParams.get("intent") === "recovery" ? "recovery" : "signup") as CallbackIntent;
      const hash = window.location.hash;

      if (hash.includes("error=") || hash.includes("error_code=")) {
        redirectTo(withQuery("/login", { notice: getNoticeFromHash(hash) }));
        return;
      }

      // Let Supabase parse and persist the URL fragment before we route away.
      await supabase.auth.initialize();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirectTo(withQuery("/login", { notice: "auth-link-invalid" }));
        return;
      }

      if (intent === "recovery") {
        redirectTo("/actualizar-contrasena");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

      setMessage("Tu correo ya quedó confirmado. Estamos terminando de cerrar tu acceso...");
      redirectTo(getDashboardPathForRole(profile?.role));
    }

    void finishAuth();
  }, []);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-4 py-10">
      <SectionCard className="grid w-full gap-6 rounded-[34px] p-8 text-center lg:p-10">
        <StatusChip tone="violet">Autenticación en progreso</StatusChip>
        <div className="grid gap-3">
          <h1 className="font-heading text-5xl leading-tight">Estamos cerrando tu acceso con seguridad.</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">{message}</p>
        </div>
        <NoticeBanner
          title="Si esta pantalla tarda demasiado"
          description="Vuelve a solicitar un correo nuevo desde UniCourse. Los enlaces de Supabase pueden expirar."
          tone="info"
        />
      </SectionCard>
    </main>
  );
}
