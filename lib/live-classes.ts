import type { StudentLiveClassSummary } from "@/lib/data/student";

const LIVE_CLASS_TIME_ZONE = "America/Mexico_City";

const liveClassDateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LIVE_CLASS_TIME_ZONE,
});

const liveClassDayFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  timeZone: LIVE_CLASS_TIME_ZONE,
});

const liveClassMonthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  timeZone: LIVE_CLASS_TIME_ZONE,
});

const liveClassTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: LIVE_CLASS_TIME_ZONE,
});

function capitalizeLabel(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getLiveClassStartDate(startsAt: string) {
  return new Date(startsAt);
}

function getLiveClassEndDate(startsAt: string, durationMinutes: number) {
  return new Date(getLiveClassStartDate(startsAt).getTime() + Math.max(durationMinutes, 30) * 60_000);
}

function formatGoogleCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function formatLiveClassDate(startsAt: string) {
  return capitalizeLabel(liveClassDateFormatter.format(getLiveClassStartDate(startsAt)));
}

export function formatLiveClassDay(startsAt: string) {
  return liveClassDayFormatter.format(getLiveClassStartDate(startsAt));
}

export function formatLiveClassMonth(startsAt: string) {
  return liveClassMonthFormatter.format(getLiveClassStartDate(startsAt)).replace(".", "").toUpperCase();
}

export function formatLiveClassTime(startsAt: string) {
  return liveClassTimeFormatter.format(getLiveClassStartDate(startsAt));
}

export function formatLiveClassTimeRange(startsAt: string, durationMinutes: number) {
  const start = getLiveClassStartDate(startsAt);
  const end = getLiveClassEndDate(startsAt, durationMinutes);
  return `${liveClassTimeFormatter.format(start)} a ${liveClassTimeFormatter.format(end)}`;
}

export function buildGoogleCalendarUrl(liveClass: StudentLiveClassSummary) {
  const start = getLiveClassStartDate(liveClass.starts_at);
  const end = getLiveClassEndDate(liveClass.starts_at, liveClass.duration_minutes);
  const details = [
    `Clase en vivo: ${liveClass.title}`,
    liveClass.course?.title ? `Curso: ${liveClass.course.title}` : null,
    `Imparte: ${liveClass.instructor_name}`,
    liveClass.meeting_url
      ? `Enlace de acceso: ${liveClass.meeting_url}`
      : "El enlace de acceso se compartirá dentro de UniCourse antes de la sesión.",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${liveClass.title} | UniCourse`,
    dates: `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`,
    details,
    location: liveClass.meeting_url ?? "UniCourse",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getLiveClassAccessDetails(liveClass: StudentLiveClassSummary, now = new Date()) {
  const start = getLiveClassStartDate(liveClass.starts_at).getTime();
  const end = getLiveClassEndDate(liveClass.starts_at, liveClass.duration_minutes).getTime();
  const joinWindowStart = start - 15 * 60_000;
  const currentTime = now.getTime();

  if (!liveClass.meeting_url) {
    return {
      tone: "amber" as const,
      label: "Enlace pendiente",
      description: "Publicaremos el link de Google Meet aquí en cuanto la sesión quede confirmada.",
    };
  }

  if (currentTime >= joinWindowStart && currentTime <= end) {
    return {
      tone: "teal" as const,
      label: "Disponible ahora",
      description: "Tu acceso ya está abierto. Puedes entrar a la sesión en cuanto quieras.",
    };
  }

  return {
    tone: "violet" as const,
    label: "Se abre 15 min antes",
    description: "Guarda esta clase en tu calendario y vuelve aquí poco antes del horario de inicio.",
  };
}

export function getLiveClassTimeZoneLabel() {
  return "Horario CDMX";
}
