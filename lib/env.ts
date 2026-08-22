type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

function readSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    return "http://localhost:3000";
  }

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return configuredUrl;
  }

  return `https://${configuredUrl}`;
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
