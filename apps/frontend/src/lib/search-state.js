export function positiveInt(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function mergeSearchParams(baseSearch, updates) {
  const params = new URLSearchParams(baseSearch || "");
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
      continue;
    }
    params.set(key, String(value));
  }
  return params.toString();
}
