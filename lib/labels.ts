import type { AccountStatus, AgeRange, UserRole } from "@/lib/profile";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const ageRangeOptions: Array<{ value: AgeRange; label: string }> = [
  { value: "under_30", label: "Menos de 30" },
  { value: "30_39", label: "30 a 39" },
  { value: "40_49", label: "40 a 49" },
  { value: "50_59", label: "50 a 59" },
  { value: "60_69", label: "60 a 69" },
  { value: "70_plus", label: "70 o más" },
  { value: "prefer_not_to_say", label: "Prefiero no decirlo" },
];

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatRoleLabel(role: UserRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "super_admin":
      return "Super admin";
    case "instructor":
      return "Instructora";
    default:
      return "Alumna";
  }
}

export function formatAccountStatusLabel(status: AccountStatus | string) {
  switch (status) {
    case "active":
      return "Activa";
    case "suspended":
      return "Suspendida";
    case "archived":
      return "Archivada";
    default:
      return "Pendiente";
  }
}

export function formatAgeRangeLabel(value: AgeRange | string | null | undefined) {
  return ageRangeOptions.find((option) => option.value === value)?.label ?? "Sin dato";
}

export function formatEnrollmentStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Activa";
    case "completed":
      return "Completada";
    case "paused":
      return "En pausa";
    case "suspended":
      return "Suspendida";
    case "revoked":
      return "Revocada";
    default:
      return status;
  }
}

export function formatAccessStateLabel(state: string) {
  return state === "enabled" ? "Con acceso" : "Sin acceso";
}

export function formatPublicationStatusLabel(status: string) {
  switch (status) {
    case "published":
      return "Publicado";
    case "archived":
      return "Archivado";
    default:
      return "Borrador";
  }
}

export function formatDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case "beginner":
      return "Principiante";
    case "intermediate":
      return "Intermedio";
    case "advanced":
      return "Avanzado";
    default:
      return "Todos los niveles";
  }
}

export function formatSubmissionStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Borrador";
    case "submitted":
      return "Pendiente";
    case "reviewed":
      return "Revisada";
    case "changes_requested":
      return "Pide cambios";
    case "approved":
      return "Aprobada";
    default:
      return status;
  }
}

export function formatProgressLabel(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}
