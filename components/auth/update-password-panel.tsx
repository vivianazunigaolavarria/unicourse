"use client";

import { useEffect, useState } from "react";

import { mapAuthErrorToSpanish } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { toBrowserAppUrl } from "@/lib/urls";

export function UpdatePasswordPanel() {
  const [supabase] = useState(() => createClient());
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setHasRecoverySession(Boolean(session?.user));
      }
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        setHasRecoverySession(Boolean(session?.user));
      }

      if (event === "SIGNED_OUT") {
        setHasRecoverySession(false);
      }
    });

    void loadSession();

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasRecoverySession) {
      setMessage({
        tone: "error",
        text: "Este enlace ya no es válido. Solicita uno nuevo desde el inicio de sesión.",
      });
      return;
    }

    setIsPending(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 8) {
      setIsPending(false);
      setMessage({ tone: "error", text: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setIsPending(false);
      setMessage({ tone: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setIsPending(false);
      setMessage({ tone: "error", text: mapAuthErrorToSpanish(error, "No pudimos actualizar tu contraseña. Intenta nuevamente.") });
      return;
    }

    await supabase.auth.signOut();
    window.location.assign(toBrowserAppUrl("/login?notice=password-updated"));
  }

  return (
    <form className="grid gap-4 rounded-[28px] border border-[var(--uc-border)] bg-white/92 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <p className="uc-kicker">Nueva contraseña</p>
        <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Protege tu acceso</h2>
        <p className="text-sm leading-7 text-[var(--uc-muted)]">
          Usa una contraseña nueva para cerrar este proceso y volver a entrar con tranquilidad.
        </p>
      </div>

      {hasRecoverySession === false ? (
        <p className="text-sm text-[#a9631f]">No encontramos una sesión de recuperación activa. Pide un enlace nuevo desde `/login`.</p>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        Nueva contraseña
        <input className="uc-input" minLength={8} name="password" required type="password" />
      </label>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        Confirmar contraseña
        <input className="uc-input" minLength={8} name="confirm_password" required type="password" />
      </label>

      {message ? <p className={message.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{message.text}</p> : null}

      <button className="uc-button-primary justify-center" disabled={isPending || hasRecoverySession !== true} type="submit">
        {isPending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
