"use client";

import Link from "next/link";
import { useState } from "react";

import { mapAuthErrorToSpanish } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPathForRole } from "@/lib/profile";

type LoginFormProps = {
  nextPath?: string | null;
};

type Message = {
  tone: "error" | "success";
  text: string;
} | null;

export function LoginForm({ nextPath }: LoginFormProps) {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSignInPending, setIsSignInPending] = useState(false);
  const [isResetPending, setIsResetPending] = useState(false);
  const [isResendPending, setIsResendPending] = useState(false);
  const [signInMessage, setSignInMessage] = useState<Message>(null);
  const [resetMessage, setResetMessage] = useState<Message>(null);
  const [resendMessage, setResendMessage] = useState<Message>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");

  async function getDestination(userId: string) {
    const fallbackDestination = nextPath ?? "/dashboard";
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

    if (error) {
      return fallbackDestination;
    }

    return nextPath ?? getDashboardPathForRole(profile?.role);
  }

  function buildAuthRedirectUrl(intent: "signup" | "recovery") {
    return `${window.location.origin}/auth/callback?intent=${intent}`;
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSignInPending(true);
    setSignInMessage(null);
    setResendMessage(null);
    setPendingConfirmationEmail("");

    const trimmedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error || !data.user) {
      setIsSignInPending(false);
      const translated = mapAuthErrorToSpanish(error, "No pudimos iniciar sesión. Intenta nuevamente.");
      const needsConfirmation = translated.includes("confirmar tu correo");

      setSignInMessage({
        tone: "error",
        text: translated,
      });

      if (needsConfirmation) {
        setPendingConfirmationEmail(trimmedEmail);
      }

      return;
    }

    const destination = await getDestination(data.user.id);
    window.location.assign(new URL(destination, window.location.origin).toString());
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetEmail = (resetEmail.trim() || email.trim()).toLowerCase();

    if (!targetEmail) {
      setResetMessage({
        tone: "error",
        text: "Escribe el correo de tu cuenta para enviarte el enlace.",
      });
      return;
    }

    setIsResetPending(true);
    setResetMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: buildAuthRedirectUrl("recovery"),
    });

    setIsResetPending(false);

    if (error) {
      setResetMessage({
        tone: "error",
        text: mapAuthErrorToSpanish(error, "No pudimos enviar el correo de recuperación. Intenta nuevamente."),
      });
      return;
    }

    setResetMessage({
      tone: "success",
      text: "Si encontramos una cuenta con ese correo, te enviaremos un enlace para cambiar tu contraseña.",
    });
  }

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) {
      setResendMessage({
        tone: "error",
        text: "Escribe tu correo arriba para reenviar la confirmación.",
      });
      return;
    }

    setIsResendPending(true);
    setResendMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingConfirmationEmail,
      options: {
        emailRedirectTo: buildAuthRedirectUrl("signup"),
      },
    });

    setIsResendPending(false);

    if (error) {
      setResendMessage({
        tone: "error",
        text: mapAuthErrorToSpanish(error, "No pudimos reenviar el correo de confirmación. Intenta nuevamente."),
      });
      return;
    }

    setResendMessage({
      tone: "success",
      text: "Te enviamos un nuevo correo de confirmación.",
    });
  }

  return (
    <div className="grid gap-6">
      <form autoComplete="off" className="grid gap-4" onSubmit={handleSignIn}>
        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Correo electrónico
          <input
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="uc-input"
            inputMode="email"
            name="login_email_address"
            onChange={(event) => {
              setEmail(event.target.value);
              setSignInMessage(null);
            }}
            required
            spellCheck={false}
            type="email"
            value={email}
          />
        </label>

        <div className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          <span>Contraseña</span>
          <input
            autoComplete="current-password"
            className="uc-input"
            minLength={8}
            onChange={(event) => {
              setPassword(event.target.value);
              setSignInMessage(null);
            }}
            required
            type={isPasswordVisible ? "text" : "password"}
            value={password}
          />
          <span className="flex items-center gap-3 text-sm text-[var(--uc-muted)]">
            <input
              checked={isPasswordVisible}
              className="uc-checkbox h-4 w-4"
              id="login-show-password"
              onChange={(event) => setIsPasswordVisible(event.target.checked)}
              type="checkbox"
            />
            <span>Mostrar contraseña</span>
          </span>
        </div>
        {signInMessage ? <p className={signInMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{signInMessage.text}</p> : null}

        <button className="uc-button-primary min-h-[3.75rem] justify-center text-base" disabled={isSignInPending} type="submit">
          {isSignInPending ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      {pendingConfirmationEmail ? (
        <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-white/78 p-4">
          <p className="text-sm leading-7 text-[var(--uc-muted)]">
            Si ya tienes tu correo, puedes usar el enlace más reciente o pedir uno nuevo desde aquí.
          </p>
          <button className="uc-button-secondary justify-center" disabled={isResendPending} onClick={handleResendConfirmation} type="button">
            {isResendPending ? "Reenviando..." : "Reenviar correo de confirmación"}
          </button>
          {resendMessage ? <p className={resendMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{resendMessage.text}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-white/78 p-4">
        <button
          className="text-left text-sm font-medium text-[var(--uc-violet)] transition hover:text-[var(--uc-teal)]"
          onClick={() => {
            setIsResetOpen((current) => !current);
            setResetMessage(null);
          }}
          type="button"
        >
          ¿Olvidaste tu contraseña?
        </button>

        {isResetOpen ? (
          <form autoComplete="off" className="grid gap-3" onSubmit={handleReset}>
            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Correo para recuperación
              <input
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className="uc-input"
                inputMode="email"
                name="recovery_email_address"
                onChange={(event) => {
                  setResetEmail(event.target.value);
                  setResetMessage(null);
                }}
                spellCheck={false}
                type="email"
                value={resetEmail}
              />
            </label>

            {resetMessage ? <p className={resetMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{resetMessage.text}</p> : null}

            <button className="uc-button-secondary justify-center" disabled={isResetPending} type="submit">
              {isResetPending ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        ) : null}
      </div>

      <p className="text-sm leading-7 text-[var(--uc-muted)]">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro">
          Crear mi cuenta
        </Link>
      </p>
    </div>
  );
}
