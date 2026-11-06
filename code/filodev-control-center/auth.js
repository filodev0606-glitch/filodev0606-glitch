// Login hub: token Google diverifikasi (tanda tangan RS256 dengan kunci publik Google),
// hanya ADMIN_EMAIL yang diterima. Sesi acak disimpan sebagai hash di D1.

import { AppError, b64urlDecode, b64urlEncode, sha256Hex } from './util.js';

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const JWKS_TTL_MS = 60 * 60 * 1000;
const JEDA_MUAT_ULANG_MS = 30 * 1000;
export const SESI_TTL_MS = 12 * 60 * 60 * 1000;
export const NAMA_COOKIE = 'fd_sesi';

let jwksCache = null;
let jwksAt = 0;

/** Hanya untuk pengujian. */
export function lupakanKunciGoogle() {
  jwksCache = null;
  jwksAt = 0;
}

async function ambilJwks(ambil = fetch, paksa = false) {
  const segar = jwksCache && Date.now() - jwksAt < JWKS_TTL_MS;
  if (segar && !(paksa && Date.now() - jwksAt > JEDA_MUAT_ULANG_MS)) return jwksCache;
  const res = await ambil(JWKS_URL);
  if (!res.ok) throw new AppError('internal', 'Gagal memeriksa token Google.', 502);
  jwksCache = (await res.json()).keys || [];
  jwksAt = Date.now();
  return jwksCache;
}

function bagianToken(token) {
  const bagian = String(token || '').split('.');
  if (bagian.length !== 3) throw new AppError('unauthenticated', 'Token tidak valid.');
  return bagian;
}

function parseBagian(teks) {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlDecode(teks)));
  } catch {
    throw new AppError('unauthenticated', 'Token tidak valid.');
  }
}

function decodeAman(teks) {
  try {
    return b64urlDecode(teks);
  } catch {
    throw new AppError('unauthenticated', 'Token tidak valid.');
  }
}

/** Memverifikasi ID token Google. `opsi.ambil` dan `opsi.sekarang` untuk pengujian. */
export async function verifikasiTokenGoogle(idToken, clientIds, opsi = {}) {
  const [kepalaB64, isiB64, tandaB64] = bagianToken(idToken);
  const kepala = parseBagian(kepalaB64);
  const isi = parseBagian(isiB64);
  if (kepala.alg !== 'RS256') throw new AppError('unauthenticated', 'Token tidak valid.');

  let kunci = (await ambilJwks(opsi.ambil)).find((k) => k.kid === kepala.kid);
  if (!kunci) kunci = (await ambilJwks(opsi.ambil, true)).find((k) => k.kid === kepala.kid);
  if (!kunci) throw new AppError('unauthenticated', 'Kunci token tidak dikenal.');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    kunci,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sah = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    decodeAman(tandaB64),
    new TextEncoder().encode(`${kepalaB64}.${isiB64}`)
  );
  if (!sah) throw new AppError('unauthenticated', 'Tanda tangan token salah.');

  const sekarang = Math.floor((opsi.sekarang ?? Date.now()) / 1000);
  const audiens = Array.isArray(clientIds) ? clientIds : [clientIds];
  if (isi.iss !== 'https://accounts.google.com' && isi.iss !== 'accounts.google.com') {
    throw new AppError('unauthenticated', 'Penerbit token tidak dikenal.');
  }
  if (!audiens.includes(isi.aud)) throw new AppError('unauthenticated', 'Token bukan untuk aplikasi ini.');
  if (!isi.exp || isi.exp < sekarang) throw new AppError('unauthenticated', 'Token kedaluwarsa. Masuk ulang.');
  if (!isi.sub) throw new AppError('unauthenticated', 'Token tidak lengkap.');
  return isi;
}

export function emailAdmin(env) {
  return String(env.ADMIN_EMAIL || '').trim().toLowerCase();
}

export function clientIds(env) {
  return String(env.GOOGLE_CLIENT_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function catatAudit(env, email, app, aksi, target = null, detail = null, sekarang = Date.now()) {
  await env.DB.prepare('INSERT INTO audit (at, email, app, aksi, target, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(sekarang, email, app, aksi, target, detail ? JSON.stringify(detail).slice(0, 2000) : null)
    .run();
}

export async function masuk(env, body, opsi = {}, sekarang = Date.now()) {
  const ids = clientIds(env);
  if (!ids.length || !emailAdmin(env)) throw new AppError('internal', 'Hub belum dikonfigurasi.', 500);
  const klaim = await verifikasiTokenGoogle(body?.id_token, ids, { ...opsi, sekarang });
  const email = String(klaim.email || '').trim().toLowerCase();
  const terverifikasi = klaim.email_verified === true || klaim.email_verified === 'true';
  if (!email || !terverifikasi || email !== emailAdmin(env)) {
    await catatAudit(env, email || 'tak-dikenal', 'hub', 'login_ditolak', null, null, sekarang);
    throw new AppError('permission-denied', 'Akun Google ini bukan admin.', 403);
  }
  const token = b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const kedaluwarsa = sekarang + SESI_TTL_MS;
  await env.DB.prepare('INSERT INTO sesi (token_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), email, sekarang, kedaluwarsa)
    .run();
  await env.DB.prepare('DELETE FROM sesi WHERE expires_at <= ?').bind(sekarang).run();
  await catatAudit(env, email, 'hub', 'login', null, null, sekarang);
  return { token, email, expires_at: kedaluwarsa };
}

export function bacaCookie(request, nama) {
  const header = request.headers.get('cookie') || '';
  for (const bagian of header.split(';')) {
    const [k, ...v] = bagian.trim().split('=');
    if (k === nama) return v.join('=');
  }
  return null;
}

/** Sesi dari cookie. Mengembalikan null bila tidak ada atau kedaluwarsa. */
export async function bacaSesi(env, request, sekarang = Date.now()) {
  const token = bacaCookie(request, NAMA_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const baris = await env.DB.prepare('SELECT email FROM sesi WHERE token_hash = ? AND expires_at > ?')
    .bind(tokenHash, sekarang)
    .first();
  return baris ? { email: baris.email, tokenHash } : null;
}

const METODE_AMAN = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Metode yang mengubah data wajib membawa header khusus dan Origin yang sama. */
export function periksaCsrf(request) {
  if (METODE_AMAN.has(request.method.toUpperCase())) return;
  const tolak = () => new AppError('permission-denied', 'Permintaan tidak sah.', 403);
  if (request.headers.get('x-fd-web') !== '1') throw tolak();
  const asal = request.headers.get('origin');
  if (asal && asal !== new URL(request.url).origin) throw tolak();
}

export function cookieSesi(token, maxAgeDetik) {
  return `${NAMA_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeDetik}`;
}

export function cookieHapus() {
  return `${NAMA_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
