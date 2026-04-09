/**
 * Extract the real client IP from request headers.
 * Cloudflare Workers: cf-connecting-ip is set by Cloudflare and cannot be spoofed.
 * Fallback: x-real-ip, then x-forwarded-for (last entry = closest proxy).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??
    'unknown'
  );
}
