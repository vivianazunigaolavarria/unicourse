export type SearchValue = string | string[] | undefined;

export function readSearchParam(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function readPositiveInt(value: SearchValue, fallback: number) {
  const rawValue = readSearchParam(value);
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}
