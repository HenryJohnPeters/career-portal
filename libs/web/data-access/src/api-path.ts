/**
 * True when a request path has a "." or ".." segment (also percent-encoded,
 * or with "\" as the separator), which fetch would resolve. An id taken from
 * a URL, such as "../account/export", must never move a request to another
 * API route.
 */
export function hasDotSegment(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] ?? "";
  return pathname.split(/[\\/]/).some((segment) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return true;
    }
    return decoded === "." || decoded === "..";
  });
}
