// Alat kecil bersama.

export class AppError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status || STATUS_BY_CODE[code] || 400;
  }
}

const STATUS_BY_CODE = {
  'invalid-argument': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  'resource-exhausted': 429,
  internal: 500,
};

export const HEADER_AMAN = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

export function json(data, status = 200, extraHeaders = {}) {
  const h = new Headers({ 'content-type': 'application/json; charset=utf-8', ...HEADER_AMAN });
  for (const [k, v] of Object.entries(extraHeaders)) {
    if (Array.isArray(v)) v.forEach((x) => h.append(k, x));
    else h.set(k, v);
  }
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function errorResponse(error) {
  if (error instanceof AppError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }
  console.error('Galat tak terduga', error && error.stack ? error.stack : error);
  return json({ error: { code: 'internal', message: 'Terjadi kesalahan di server.' } }, 500);
}

export async function sha256Hex(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function b64urlEncode(bytes) {
  const biner = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  let s = '';
  for (const b of biner) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(text) {
  const pad = '='.repeat((4 - (text.length % 4)) % 4);
  const biner = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(biner.length);
  for (let i = 0; i < biner.length; i++) out[i] = biner.charCodeAt(i);
  return out;
}

export const MAKS_JSON_BYTE = 64 * 1024;
export const MAKS_RAW_BYTE = 4 * 1024 * 1024;

export async function readJson(request) {
  const diumumkan = Number(request.headers.get('content-length') || 0);
  if (diumumkan > MAKS_JSON_BYTE) throw new AppError('invalid-argument', 'Permintaan terlalu besar.', 413);
  let teks;
  try {
    teks = await request.text();
  } catch {
    throw new AppError('invalid-argument', 'Permintaan tidak terbaca.');
  }
  if (teks.length > MAKS_JSON_BYTE) throw new AppError('invalid-argument', 'Permintaan terlalu besar.', 413);
  try {
    return teks ? JSON.parse(teks) : {};
  } catch {
    throw new AppError('invalid-argument', 'Permintaan tidak terbaca.');
  }
}
