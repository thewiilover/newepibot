export function parseCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  const parts = header.split(/;\s*/);
  for (const part of parts) {
    const [cookieName, ...valueParts] = part.split("=");
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

export function buildCookie(
  name: string,
  value: string,
  options: { maxAge?: number; httpOnly?: boolean; path?: string; sameSite?: "lax" | "strict" | "none"; secure?: boolean } = {},
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) segments.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.path) segments.push(`Path=${options.path}`);
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  if (options.secure) segments.push("Secure");

  return segments.join("; ");
}