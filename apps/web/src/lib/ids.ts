/** Record ids are UUIDs (Prisma `@default(uuid())`). */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * An id read from the URL (`?job=`, `?session=` …), or null. Anything else is
 * dropped before it can become part of an API path: a value such as
 * "../account/export" would otherwise send a signed-in request to another route.
 */
export function idParam(value: string | null | undefined): string | null {
  return isUuid(value) ? value : null;
}
