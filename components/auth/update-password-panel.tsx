"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getDashboardPathForRole } from "@/lib/profile";

type UpdatePasswordPanelProps = {
  fallbackPath: string;
};

export function UpdatePasswordPanel({ fallbackPath }: UpdatePasswordPanelProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setMessage({ tone: "error", text: error.message });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      startTransition(() => {
        router.replace("/iniciar-sesion?notice=password-updated");
        router.refresh();
      });
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const destination = getDashboardPathForRole(profile?.role) || fallbackPath;

    startTransition(() => {
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4 rounded-[28px] border border-[var(--uc-border)] bg-white/92 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <p className="uc-kicker">Nueva contraseña</p>
        <h2 className="font-heading text-3xl text-[var(--uc-ink)]">Protege tu acceso</h2>
        <p className="text-sm leading-7 text-[var(--uc-muted)]">
          Usa una contraseña nueva para cerrar este proceso y volver a tu panel.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        Nueva contraseña
        <input className="uc-input" minLength={8} name="password" required type="password" />
      </label>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        Confirmar contraseña
        <input className="uc-input" minLength={8} name="confirm_password" required type="password" />
      </label>

      {message ? <p className={message.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{message.text}</p> : null}

      <button className="uc-button-primary justify-center" disabled={isPending} type="submit">
        {isPending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
