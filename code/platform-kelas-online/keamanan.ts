// Header keamanan untuk respons yang dibuat Worker (SSR + API). Berkas statis memakai public/_headers,
// yang HARUS berisi nilai sama (diperiksa oleh scripts/cek-kamus.mjs).
// Skrip: hanya berkas milik sendiri (tanpa 'unsafe-inline'), sehingga XSS yang menyisipkan <script>/on*= tidak jalan.
// Gaya masih 'unsafe-inline' karena ratusan atribut style=; risikonya jauh lebih kecil daripada skrip.
// scripts/cek-kamus.mjs menggagalkan build bila ada skrip inline atau atribut on*= di hasil build.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const PERMISSIONS = 'camera=(self), microphone=(self), display-capture=(self), geolocation=()';

export function pasangHeaderKeamanan(h: Headers, produksi: boolean) {
  const set = (k: string, v: string) => { if (!h.has(k)) h.set(k, v); };
  set('x-content-type-options', 'nosniff');
  set('x-frame-options', 'DENY');
  set('referrer-policy', 'strict-origin-when-cross-origin');
  set('permissions-policy', PERMISSIONS);
  if (produksi) {
    set('strict-transport-security', 'max-age=31536000; includeSubDomains');
    set('content-security-policy', CSP);
  }
}
