import type { StudentLiveClassSummary } from "@/lib/data/student";

const LIVE_CLASS_TIME_ZONE = "America/Mexico_City";
const CALENDAR_WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

const liveClassDateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LIVE_CLASS_TIME_ZONE,
});

const liveClassMonthYearFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
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

const liveClassDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: LIVE_CLASS_TIME_ZONE,
});

type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
};

export type LiveClassCalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  liveClasses: StudentLiveClassSummary[];
};

export type LiveClassesMonthView = {
  monthLabel: string;
  weekdayLabels: readonly string[];
  days: LiveClassCalendarDay[];
  hasClassesInMonth: boolean;
  currentMonthClassCount: number;
};

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

function getCalendarDateParts(value: Date | string): CalendarDateParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = liveClassDatePartsFormatter.formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "1"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
  };
}

function createCalendarDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

function createCalendarDateFromValue(value: Date | string) {
  const { year, month, day } = getCalendarDateParts(value);
  return createCalendarDate(year, month - 1, day);
}

function addCalendarDays(date: Date, amount: number) {
  return createCalendarDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount);
}

function getCalendarDateKey(value: Date | string) {
  const { year, month, day } = getCalendarDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatLiveClassDate(startsAt: string) {
  return capitalizeLabel(liveClassDateFormatter.format(getLiveClassStartDate(startsAt)));
}

export function formatLiveClassMonthLabel(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return capitalizeLabel(liveClassMonthYearFormatter.format(date));
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
    label: "Meet listo",
    description: "La clase ya tiene enlace de Google Meet. Guárdala en Google Calendar y tenlo a mano para entrar a tiempo.",
  };
}

export function buildLiveClassesMonthView(liveClasses: StudentLiveClassSummary[], now = new Date()): LiveClassesMonthView {
  const focusDate = liveClasses.length > 0 ? createCalendarDateFromValue(liveClasses[0].starts_at) : createCalendarDateFromValue(now);
  const monthStart = createCalendarDate(focusDate.getUTCFullYear(), focusDate.getUTCMonth(), 1);
  const monthStartOffset = (monthStart.getUTCDay() + 6) % 7;
  const gridStart = addCalendarDays(monthStart, -monthStartOffset);
  const todayKey = getCalendarDateKey(now);

  const liveClassesByDay = new Map<string, StudentLiveClassSummary[]>();
  for (const liveClass of liveClasses) {
    const dateKey = getCalendarDateKey(liveClass.starts_at);
    const dayClasses = liveClassesByDay.get(dateKey) ?? [];
    dayClasses.push(liveClass);
    liveClassesByDay.set(dateKey, dayClasses);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = addCalendarDays(gridStart, index);
    const dateKey = getCalendarDateKey(date);

    return {
      date,
      dateKey,
      dayNumber: String(date.getUTCDate()),
      isCurrentMonth: date.getUTCMonth() === monthStart.getUTCMonth(),
      isToday: dateKey === todayKey,
      liveClasses: liveClassesByDay.get(dateKey) ?? [],
    };
  });

  return {
    monthLabel: formatLiveClassMonthLabel(monthStart),
    weekdayLabels: CALENDAR_WEEKDAY_LABELS,
    days,
    hasClassesInMonth: days.some((day) => day.isCurrentMonth && day.liveClasses.length > 0),
    currentMonthClassCount: days.reduce(
      (total, day) => total + (day.isCurrentMonth ? day.liveClasses.length : 0),
      0,
    ),
  };
}

export function getLiveClassTimeZoneLabel() {
  return "Horario CDMX";
}
