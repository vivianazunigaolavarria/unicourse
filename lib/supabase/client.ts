import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/env";

export function createClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return createBrowserClient(config.url, config.publishableKey);
}

