"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { countrySuggestions, occupationOptions } from "@/lib/account";
import { mapAuthErrorToSpanish } from "@/lib/auth-errors";
import type { ViewerProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

type StudentProfileFormProps = {
  profile: ViewerProfile;
};

type Message = {
  tone: "error" | "success";
  text: string;
} | null;

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function StudentProfileForm({ profile }: StudentProfileFormProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [form, setForm] = useState({
    firstName: profile.first_name,
    lastName: profile.last_name,
    dateOfBirth: profile.date_of_birth ?? "",
    occupation: profile.occupation ?? "",
    country: profile.country ?? "",
  });

  const maxBirthDate = getTodayInputValue();

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.occupation || !form.country.trim()) {
      setMessage({
        tone: "error",
        text: "Completa todos los campos obligatorios antes de guardar.",
      });
      return;
    }

    if (form.dateOfBirth > maxBirthDate) {
      setMessage({
        tone: "error",
        text: "La fecha de nacimiento no puede estar en el futuro.",
      });
      return;
    }

    setIsPending(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        date_of_birth: form.dateOfBirth,
        occupation: form.occupation,
        country: form.country.trim(),
      })
      .eq("id", profile.id);

    setIsPending(false);

    if (error) {
      setMessage({
        tone: "error",
        text: mapAuthErrorToSpanish(error, "No pudimos guardar tus cambios. Intenta nuevamente."),
      });
      return;
    }

    setMessage({
      tone: "success",
      text: "Tus datos quedaron guardados.",
    });
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Nombre
          <input className="uc-input" onChange={(event) => updateField("firstName", event.target.value)} required value={form.firstName} />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Apellido
          <input className="uc-input" onChange={(event) => updateField("lastName", event.target.value)} required value={form.lastName} />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        Correo electrónico
        <input className="uc-input opacity-80" disabled readOnly value={profile.email} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Fecha de nacimiento
          <input
            className="uc-input"
            max={maxBirthDate}
            min="1900-01-01"
            onChange={(event) => updateField("dateOfBirth", event.target.value)}
            required
            type="date"
            value={form.dateOfBirth}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Ocupación
          <select className="uc-input" onChange={(event) => updateField("occupation", event.target.value)} required value={form.occupation}>
            <option value="">Selecciona una opción</option>
            {occupationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        País
        <input
          autoComplete="country-name"
          className="uc-input"
          list="profile-country-list"
          onChange={(event) => updateField("country", event.target.value)}
          required
          value={form.country}
        />
        <datalist id="profile-country-list">
          {countrySuggestions.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>
      </label>

      {message ? <p className={message.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{message.text}</p> : null}

      <button className="uc-button-primary justify-center" disabled={isPending} type="submit">
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
