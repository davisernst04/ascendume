/** Returns `path` if it is a same-site path ("/new"), otherwise "/". Blocks "//evil.com" and "/\evil.com". */
export function safeRedirectPath(path: string | string[] | undefined | null): string {
  if (typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  return path;
}
