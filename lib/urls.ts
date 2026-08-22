const DEFAULT_APP_ORIGIN = "https://www.unicourse.training";

export function withQuery(pathname: string, entries: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();

  Object.entries(entries).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function normalizeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCanonicalAppOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredOrigin) {
    return DEFAULT_APP_ORIGIN;
  }

  return configuredOrigin.startsWith("http://") || configuredOrigin.startsWith("https://")
    ? configuredOrigin
    : `https://${configuredOrigin}`;
}

export function getBrowserAppOrigin() {
  if (typeof window === "undefined") {
    return getCanonicalAppOrigin();
  }

  const browserOrigin = window.location.origin;

  if (
    browserOrigin.includes("localhost") ||
    browserOrigin.includes("127.0.0.1") ||
    browserOrigin.includes("0.0.0.0")
  ) {
    return getCanonicalAppOrigin();
  }

  return browserOrigin;
}

export function toBrowserAppUrl(pathname: string) {
  return new URL(pathname, getBrowserAppOrigin()).toString();
}
