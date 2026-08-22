"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { countrySuggestions, occupationOptions } from "@/lib/account";
import { mapAuthErrorToSpanish } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  occupation: string;
  country: string;
  acceptedTerms: boolean;
};

type FieldErrors = Partial<Record<keyof RegisterFormState, string>>;

type FormMessage = {
  tone: "error" | "success";
  text: string;
} | null;

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function RegisterForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [isPending, setIsPending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<FormMessage>(null);
  const [form, setForm] = useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    occupation: "",
    country: "",
    acceptedTerms: false,
  });

  const maxBirthDate = getTodayInputValue();

  function updateField<K extends keyof RegisterFormState>(field: K, value: RegisterFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
    setFormMessage(null);
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};
    const trimmedFirstName = form.firstName.trim();
    const trimmedLastName = form.lastName.trim();
    const trimmedEmail = form.email.trim();
    const trimmedCountry = form.country.trim();

    if (!trimmedFirstName) {
      nextErrors.firstName = "Cuéntanos tu nombre.";
    }

    if (!trimmedLastName) {
      nextErrors.lastName = "Cuéntanos tu apellido.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Escribe tu correo electrónico.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Revisa que tu correo esté escrito correctamente.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Tu contraseña debe tener al menos 8 caracteres.";
    }

    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = "Necesitamos tu fecha de nacimiento.";
    } else if (form.dateOfBirth > maxBirthDate) {
      nextErrors.dateOfBirth = "La fecha de nacimiento no puede estar en el futuro.";
    }

    if (!form.occupation) {
      nextErrors.occupation = "Selecciona la opción que mejor te describe.";
    }

    if (!trimmedCountry) {
      nextErrors.country = "Escribe o selecciona tu país.";
    }

    if (!form.acceptedTerms) {
      nextErrors.acceptedTerms = "Necesitamos tu aceptación para continuar.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsPending(true);
    setFormMessage(null);

    const trimmedEmail = form.email.trim().toLowerCase();
    const appUrl = window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: form.password,
      options: {
        emailRedirectTo: appUrl,
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          date_of_birth: form.dateOfBirth,
          occupation: form.occupation,
          country: form.country.trim(),
        },
      },
    });

    if (error) {
      setIsPending(false);
      setFormMessage({
        tone: "error",
        text: mapAuthErrorToSpanish(error, "No pudimos completar el registro. Intenta nuevamente."),
      });
      return;
    }

    if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
      setIsPending(false);
      setFormMessage({
        tone: "error",
        text: "Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?",
      });
      return;
    }

    if (data.session) {
      await supabase.auth.signOut();
      setIsPending(false);
      setFormMessage({
        tone: "error",
        text: "La confirmación por correo todavía no está activa en Supabase. Hay que habilitarla antes de abrir el registro.",
      });
      return;
    }

    router.push("/revisa-tu-correo");
  }

  return (
    <form autoComplete="off" className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Nombre
          <input
            autoComplete="given-name"
            className="uc-input"
            name="first_name"
            onChange={(event) => updateField("firstName", event.target.value)}
            required
            value={form.firstName}
          />
          {fieldErrors.firstName ? <p className="text-sm text-[#a9631f]">{fieldErrors.firstName}</p> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Apellido
          <input
            autoComplete="family-name"
            className="uc-input"
            name="last_name"
            onChange={(event) => updateField("lastName", event.target.value)}
            required
            value={form.lastName}
          />
          {fieldErrors.lastName ? <p className="text-sm text-[#a9631f]">{fieldErrors.lastName}</p> : null}
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        Correo electrónico
        <input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="uc-input"
          inputMode="email"
          name="register_email_address"
          onChange={(event) => updateField("email", event.target.value)}
          required
          spellCheck={false}
          type="email"
          value={form.email}
        />
        {fieldErrors.email ? <p className="text-sm text-[#a9631f]">{fieldErrors.email}</p> : null}
      </label>

      <div className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        <span>Contraseña</span>
        <input
          autoComplete="new-password"
          className="uc-input"
          minLength={8}
          name="password"
          onChange={(event) => updateField("password", event.target.value)}
          required
          type={isPasswordVisible ? "text" : "password"}
          value={form.password}
        />
        <span className="flex items-center gap-3 text-sm text-[var(--uc-muted)]">
          <input
            checked={isPasswordVisible}
            className="uc-checkbox h-4 w-4"
            id="register-show-password"
            onChange={(event) => setIsPasswordVisible(event.target.checked)}
            type="checkbox"
          />
          <span>Mostrar contraseña</span>
        </span>
        {fieldErrors.password ? <p className="text-sm text-[#a9631f]">{fieldErrors.password}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Fecha de nacimiento
          <input
            className="uc-input"
            max={maxBirthDate}
            min="1900-01-01"
            name="date_of_birth"
            onChange={(event) => updateField("dateOfBirth", event.target.value)}
            required
            type="date"
            value={form.dateOfBirth}
          />
          {fieldErrors.dateOfBirth ? <p className="text-sm text-[#a9631f]">{fieldErrors.dateOfBirth}</p> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
          Ocupación
          <select
            className="uc-input"
            name="occupation"
            onChange={(event) => updateField("occupation", event.target.value)}
            required
            value={form.occupation}
          >
            <option value="">Selecciona una opción</option>
            {occupationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.occupation ? <p className="text-sm text-[#a9631f]">{fieldErrors.occupation}</p> : null}
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
        País
        <input
          autoComplete="country-name"
          className="uc-input"
          list="unicourse-country-list"
          name="country"
          onChange={(event) => updateField("country", event.target.value)}
          placeholder="Escribe o elige tu país"
          required
          value={form.country}
        />
        <datalist id="unicourse-country-list">
          {countrySuggestions.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>
        {fieldErrors.country ? <p className="text-sm text-[#a9631f]">{fieldErrors.country}</p> : null}
      </label>

      <label className="grid gap-2 rounded-[22px] border border-[var(--uc-border)] bg-white/80 p-4 text-sm text-[var(--uc-ink)]">
        <span className="flex items-start gap-3">
          <input
            checked={form.acceptedTerms}
            className="uc-checkbox mt-1 h-4 w-4"
            name="accepted_terms"
            onChange={(event) => updateField("acceptedTerms", event.target.checked)}
            required
            type="checkbox"
          />
          <span className="leading-7">
            Acepto los{" "}
            <Link href="/terminos">
              Términos y Condiciones
            </Link>{" "}
            y el{" "}
            <Link href="/privacidad">
              Aviso de Privacidad
            </Link>
            .
          </span>
        </span>
        {fieldErrors.acceptedTerms ? <p className="text-sm text-[#a9631f]">{fieldErrors.acceptedTerms}</p> : null}
      </label>

      {formMessage ? (
        <p className={formMessage.tone === "error" ? "text-sm text-[#a9631f]" : "text-sm text-[var(--uc-teal)]"}>{formMessage.text}</p>
      ) : null}

      <button className="uc-button-primary min-h-[3.75rem] justify-center text-base" disabled={isPending} type="submit">
        {isPending ? "Creando tu cuenta..." : "Crear mi cuenta"}
      </button>
    </form>
  );
}
