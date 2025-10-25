// Jednoduché get/set podľa dot-path (bez JSONPath). Môžeš nahradiť lodash.get/set.
// Rešpektujeme len vlastnosti s platnými názvami (a-z0-9_ a .)
export function getByPath(obj: any, path: string) {
  if (!path) return obj;
  const keys = path.split(".").filter(Boolean);
  return keys.reduce(
    (acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined),
    obj
  );
}

export function setByPath(obj: any, path: string, value: any) {
  const keys = path.split(".").filter(Boolean);
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!cursor[k] || typeof cursor[k] !== "object") cursor[k] = {};
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;
  return obj;
}
