let counter = 0;

/** Generate a unique, human-readable id with a stable prefix. */
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(3, "0")}`;
}
