type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

type AdminSupabaseConfig = {
  url: string;
  secretKey: string;
};

type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  timeZone: string;
};

const GOOGLE_CALENDAR_REQUIRED_ENV_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
] as const;

function readSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function readSupabaseSecretKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
}

export function getSupabasePublicConfig(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = readSupabasePublishableKey();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function getAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (!configuredUrl) {
    return "https://www.unicourse.training";
  }

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return configuredUrl;
  }

  return `https://${configuredUrl}`;
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}

export function getSupabaseAdminConfig(): AdminSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = readSupabaseSecretKey();

  if (!url || !secretKey) {
    return null;
  }

  return { url, secretKey };
}

export function getGoogleCalendarMissingKeys() {
  return GOOGLE_CALENDAR_REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

export function getGoogleCalendarConfig(): GoogleCalendarConfig | null {
  const missingKeys = getGoogleCalendarMissingKeys();

  if (missingKeys.length > 0) {
    return null;
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!.trim(),
    calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
    timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE?.trim() || "America/Mexico_City",
  };
}

export function isGoogleCalendarConfigured() {
  return getGoogleCalendarConfig() !== null;
}
