import type { ProfileOccupation } from "@/lib/profile";

export const occupationOptions: Array<{ value: ProfileOccupation; label: string }> = [
  { value: "employed_professional", label: "Empleada / profesionista" },
  { value: "entrepreneur", label: "Emprendedora" },
  { value: "business_owner", label: "Dueña de negocio" },
  { value: "homemaker", label: "Ama de casa" },
  { value: "caregiver", label: "Cuidadora" },
  { value: "student", label: "Estudiante" },
  { value: "freelancer", label: "Freelancer / independiente" },
  { value: "career_transition", label: "En transición profesional" },
  { value: "retired", label: "Jubilada" },
  { value: "other", label: "Otra" },
  { value: "prefer_not_to_say", label: "Prefiero no decirlo" },
];

export const countrySuggestions = [
  "Alemania",
  "Argentina",
  "Australia",
  "Austria",
  "Bélgica",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Corea del Sur",
  "Costa Rica",
  "Cuba",
  "Dinamarca",
  "Ecuador",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Filipinas",
  "Finlandia",
  "Francia",
  "Grecia",
  "Guatemala",
  "Honduras",
  "India",
  "Irlanda",
  "Israel",
  "Italia",
  "Japón",
  "México",
  "Marruecos",
  "Nicaragua",
  "Noruega",
  "Nueva Zelanda",
  "Panamá",
  "Paraguay",
  "Países Bajos",
  "Perú",
  "Polonia",
  "Portugal",
  "Puerto Rico",
  "Reino Unido",
  "República Checa",
  "República Dominicana",
  "Rumania",
  "Singapur",
  "Sudáfrica",
  "Suecia",
  "Suiza",
  "Turquía",
  "Uruguay",
  "Venezuela",
];

export function formatOccupationLabel(value: ProfileOccupation | string | null | undefined) {
  return occupationOptions.find((option) => option.value === value)?.label ?? "Sin dato";
}

export function obfuscateEmail(email: string | null | undefined) {
  if (!email) {
    return "";
  }

  const [localPart, domainPart] = email.split("@");

  if (!localPart || !domainPart) {
    return email;
  }

  const [domainName, ...domainSuffixParts] = domainPart.split(".");
  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  const visibleDomain = domainName.slice(0, Math.min(2, domainName.length));
  const hiddenLocal = "•".repeat(Math.max(1, Math.min(6, localPart.length - visibleLocal.length)));
  const hiddenDomain = "•".repeat(Math.max(1, Math.min(6, domainName.length - visibleDomain.length)));
  const suffix = domainSuffixParts.length > 0 ? `.${domainSuffixParts.join(".")}` : "";

  return `${visibleLocal}${hiddenLocal}@${visibleDomain}${hiddenDomain}${suffix}`;
}
