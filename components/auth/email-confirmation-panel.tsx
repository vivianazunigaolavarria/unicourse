"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { mapAuthErrorToSpanish } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { toBrowserAppUrl } from "@/lib/urls";

type Message = {
  tone: "error" | "success";
  text: string;
} | null;

export function EmailConfirmationPanel() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
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
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setMessage({
        tone: "error",
        text: "Escribe tu correo para volver a enviarte el enlace.",
      });
      return;
    }

    setIsPending(true);
    setMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmedEmail,
      options: {
        emailRedirectTo: toBrowserAppUrl("/auth/callback?intent=signup"),
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
    setEmail("");
    setMessage({
      tone: "success",
      text: "Te enviamos un nuevo correo de confirmación.",
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4 text-sm leading-7 text-[var(--uc-muted)]">
        <p>
          Para reenviar el enlace sin arrastrar un correo anterior, escribe aquí tu dirección otra vez.
        </p>
        <p>
          Si hubo un error en la dirección original, puedes volver a <Link href="/registro">crear tu cuenta</Link> con el correo correcto.
        </p>
      </div>

      <label className="grid gap-2 text-left text-sm font-medium text-[var(--uc-ink)]">
        Correo electrónico
        <input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="uc-input"
          inputMode="email"
          name="confirmation_email_address"
          onChange={(event) => {
            setEmail(event.target.value);
            setMessage(null);
          }}
          spellCheck={false}
          type="email"
          value={email}
        />
      </label>

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
