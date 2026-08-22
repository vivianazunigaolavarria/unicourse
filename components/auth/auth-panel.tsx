"use client";

import { startTransition, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { ageRangeOptions } from "@/lib/labels";
import { getDashboardPathForRole } from "@/lib/profile";
import { withQuery } from "@/lib/urls";

type AuthPanelProps = {
  appUrl: string;
  nextPath?: string | null;
};

type AuthMessage = {
  tone: "error" | "success";
  text: string;
} | null;

export function AuthPanel({ appUrl, nextPath }: AuthPanelProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [signInMessage, setSignInMessage] = useState<AuthMessage>(null);
  const [signUpMessage, setSignUpMessage] = useState<AuthMessage>(null);
  const [resetMessage, setResetMessage] = useState<AuthMessage>(null);
  const [isSignInPending, setIsSignInPending] = useState(false);
  const [isSignUpPending, setIsSignUpPending] = useState(false);
  const [isResetPending, setIsResetPending] = useState(false);

  async function loadDashboardPath(userId: string) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    return getDashboardPathForRole(profile?.role);
  }

  function getSignupConfirmationPath() {
    if (!nextPath || nextPath.startsWith("/admin")) {
      return "/mis-cursos";
    }

    return nextPath;
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSignInPending(true);
    setSignInMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setIsSignInPending(false);
      setSignInMessage({
        tone: "error",
        text: error?.message ?? "No pudimos iniciar sesión con esos datos.",
      });
      return;
    }

    const destination = nextPath ?? (await loadDashboardPath(data.user.id));

    startTransition(() => {
      router.replace(destination);
      router.refresh();
    });
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSignUpPending(true);
    setSignUpMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("signup_email") ?? "").trim();
    const password = String(formData.get("signup_password") ?? "");

    const redirectUrl = new URL(withQuery("/auth/confirm", { next: getSignupConfirmationPath() }), appUrl).toString();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: String(formData.get("first_name") ?? "").trim(),
          last_name: String(formData.get("last_name") ?? "").trim(),
          age_range: String(formData.get("age_range") ?? "").trim() || null,
          phone: String(formData.get("phone") ?? "").trim() || null,
          country: String(formData.get("country") ?? "").trim() || null,
        },
      },
    });

    if (error) {
      setIsSignUpPending(false);
      setSignUpMessage({
        tone: "error",
        text: error.message,
      });
      return;
    }

    if (data.user && data.session) {
      const destination = await loadDashboardPath(data.user.id);

      startTransition(() => {
        router.replace(destination);
        router.refresh();
      });
      return;
    }

    setIsSignUpPending(false);
    setSignUpMessage({
      tone: "success",
      text: "Tu cuenta ya quedó creada. Revisa tu correo para confirmar y entrar a UniCourse.",
    });
    event.currentTarget.reset();
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsResetPending(true);
    setResetMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("reset_email") ?? "").trim();
    const redirectTo = new URL(withQuery("/auth/confirm", { next: "/actualizar-contrasena" }), appUrl).toString();

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setIsResetPending(false);
      setResetMessage({
        tone: "error",
        text: error.message,
      });
      return;
    }

    setIsResetPending(false);
    setResetMessage({
      tone: "success",
      text: "Te enviamos un correo con el enlace para restablecer tu contraseña.",
    });
    event.currentTarget.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,252,0.96))] p-6">
        <div className="grid gap-2">
          <p className="uc-kicker">Iniciar sesión</p>
          <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Entrar a tu espacio</h2>
          <p className="text-sm leading-7 text-[var(--uc-muted)]">
            Accede a tus cursos, tus entregas o al panel administrativo según tu rol.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSignIn}>
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Correo electrónico
            <span className="flex items-center gap-3 rounded-2xl border border-[var(--uc-border)] bg-white px-4 py-3">
              <Mail className="h-4 w-4 text-[var(--uc-muted)]" />
              <input
                className="w-full bg-transparent text-[var(--uc-ink)] outline-none"
                name="email"
                required
                type="email"
              />
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Contraseña
            <span className="flex items-center gap-3 rounded-2xl border border-[var(--uc-border)] bg-white px-4 py-3">
              <LockKeyhole className="h-4 w-4 text-[var(--uc-muted)]" />
              <input
                className="w-full bg-transparent text-[var(--uc-ink)] outline-none"
                name="password"
                required
                type="password"
              />
            </span>
          </label>

          {signInMessage ? (
            <p className={signInMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>
              {signInMessage.text}
            </p>
          ) : null}

          <button className="uc-button-primary mt-2 justify-center" disabled={isSignInPending} type="submit">
            {isSignInPending ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </section>

      <section className="grid gap-6">
        <div className="grid gap-5 rounded-[28px] border border-[var(--uc-border)] bg-white/90 p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Crear cuenta</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Registro de alumna</h2>
          </div>

          <form className="grid gap-4" onSubmit={handleSignUp}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Nombre
                <input className="uc-input" name="first_name" required type="text" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Apellido
                <input className="uc-input" name="last_name" required type="text" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Correo electrónico
              <input className="uc-input" name="signup_email" required type="email" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Contraseña
              <input className="uc-input" minLength={8} name="signup_password" required type="password" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Rango de edad
                <select className="uc-input" defaultValue="" name="age_range">
                  <option value="">Opcional</option>
                  {ageRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
                Teléfono
                <input className="uc-input" name="phone" type="tel" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              País
              <span className="flex items-center gap-3 rounded-2xl border border-[var(--uc-border)] bg-white px-4 py-3">
                <UserRound className="h-4 w-4 text-[var(--uc-muted)]" />
                <input className="w-full bg-transparent text-[var(--uc-ink)] outline-none" name="country" type="text" />
              </span>
            </label>

            {signUpMessage ? (
              <p className={signUpMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>
                {signUpMessage.text}
              </p>
            ) : null}

            <button className="uc-button-primary justify-center" disabled={isSignUpPending} type="submit">
              {isSignUpPending ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.06)] p-6">
          <div className="grid gap-2">
            <p className="uc-kicker">Recuperación</p>
            <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Restablecer contraseña</h2>
          </div>

          <form className="grid gap-4" onSubmit={handleReset}>
            <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
              Correo de acceso
              <input className="uc-input" name="reset_email" required type="email" />
            </label>

            {resetMessage ? (
              <p className={resetMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>
                {resetMessage.text}
              </p>
            ) : null}

            <button className="uc-button-secondary justify-center" disabled={isResetPending} type="submit">
              {isResetPending ? "Enviando..." : "Enviar enlace"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
