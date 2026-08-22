"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { obfuscateEmail } from "@/lib/account";
import { mapAuthErrorToSpanish } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

type EmailConfirmationPanelProps = {
  email: string | null;
};

type Message = {
  tone: "error" | "success";
  text: string;
} | null;

export function EmailConfirmationPanel({ email }: EmailConfirmationPanelProps) {
  const [supabase] = useState(() => createClient());
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  async function handleResend() {
    if (!email) {
      setMessage({
        tone: "error",
        text: "Primero necesitamos tu correo para volver a enviarte el enlace.",
      });
      return;
    }

    setIsPending(true);
    setMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setIsPending(false);

    if (error) {
      setMessage({
        tone: "error",
        text: mapAuthErrorToSpanish(error, "No pudimos reenviar el correo de confirmación. Intenta nuevamente."),
      });
      return;
    }

    setCooldownSeconds(60);
    setMessage({
      tone: "success",
      text: "Te enviamos un nuevo correo de confirmación.",
    });
  }

  return (
    <div className="grid gap-5">
      {email ? (
        <div className="rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4 text-sm leading-7 text-[var(--uc-muted)]">
          Lo enviamos a <span className="font-medium text-[var(--uc-ink)]">{obfuscateEmail(email)}</span>. Si hay un error en la dirección,
          vuelve a <Link href="/registro">crear tu cuenta</Link> con el correo correcto.
        </div>
      ) : null}

      {message ? <p className={message.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{message.text}</p> : null}

      <button
        className="uc-button-secondary justify-center"
        disabled={isPending || cooldownSeconds > 0}
        onClick={handleResend}
        type="button"
      >
        {isPending
          ? "Reenviando..."
          : cooldownSeconds > 0
            ? `Espera ${cooldownSeconds}s para reenviar`
            : "Reenviar correo de confirmación"}
      </button>
    </div>
  );
}
