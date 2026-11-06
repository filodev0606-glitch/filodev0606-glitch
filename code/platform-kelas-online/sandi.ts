// Kata sandi: PBKDF2-SHA256 (WebCrypto). 100.000 iterasi = batas maksimum yang diizinkan Workers.
// Format tersimpan: pbkdf2$<iterasi>$<salt b64url>$<hash b64url>; versi ikut tersimpan sehingga bisa dinaikkan nanti.
const ITERASI = 100_000;
const enc = new TextEncoder();

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dariB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function turunkan(sandi: string, salt: Uint8Array, iterasi: number): Promise<Uint8Array> {
  const kunci = await crypto.subtle.importKey('raw', enc.encode(sandi.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterasi }, kunci, 256));
}

export async function hashSandi(sandi: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERASI}$${b64(salt)}$${b64(await turunkan(sandi, salt, ITERASI))}`;
}

function samaWaktuKonstan(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export async function cekSandi(sandi: string, tersimpan: string): Promise<boolean> {
  const [skema, it, salt, hash] = tersimpan.split('$');
  if (skema !== 'pbkdf2' || !salt || !hash) return false;
  const iterasi = Number(it);
  if (!Number.isInteger(iterasi) || iterasi < 1000 || iterasi > 1_000_000) return false;
  return samaWaktuKonstan(await turunkan(sandi, dariB64(salt), iterasi), dariB64(hash));
}

/** Perlu hash ulang (mis. iterasi dinaikkan)? Dipakai setelah login berhasil. */
export const perluHashUlang = (tersimpan: string) => Number(tersimpan.split('$')[1]) < ITERASI;

/** Hash palsu agar waktu respons sama untuk email yang tidak ada (tidak membocorkan email terdaftar). */
let hashPalsu: Promise<string> | null = null;
export async function sandiPalsu(sandi: string): Promise<void> {
  hashPalsu ??= hashSandi('palsu-' + Math.random());
  await cekSandi(sandi, await hashPalsu);
}

const UMUM = new Set(
  ('password,password1,password123,12345678,123456789,1234567890,qwertyui,qwerty123,iloveyou,11111111,00000000,' +
    'abc12345,admin123,welcome1,letmein1,passw0rd,p@ssw0rd,monkey12,dragon12,sunshine,princess,football,baseball,' +
    'bismillah,alhamdulillah,assalamualaikum,muhammad,abdullah,indonesia,sayangku,rahasia1,kataSandi,katasandi,' +
    'sandi123,123123123,987654321,88888888,12341234,qazwsx12,1q2w3e4r,zaq12wsx,aaaaaaaa').toLowerCase().split(','),
);

export type GalatSandi = 'pendek' | 'panjang' | 'umum' | 'sama_email';

export function validasiSandi(sandi: string, email: string): GalatSandi | null {
  if (sandi.length < 8) return 'pendek';
  if (sandi.length > 128) return 'panjang';
  const k = sandi.toLowerCase();
  if (UMUM.has(k) || /^(.)\1+$/.test(sandi)) return 'umum';
  if (k === email.toLowerCase() || k === email.toLowerCase().split('@')[0]) return 'sama_email';
  return null;
}

/** Cek sandi bocor lewat Pwned Passwords (k-anonymity: hanya 5 karakter awal SHA-1 yang dikirim). Gagal-terbuka. */
export async function sandiBocor(sandi: string): Promise<boolean> {
  try {
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', enc.encode(sandi))), (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    const r = await fetch('https://api.pwnedpasswords.com/range/' + sha.slice(0, 5), { headers: { 'add-padding': 'true' }, signal: AbortSignal.timeout(2500) });
    if (!r.ok) return false;
    const sisa = sha.slice(5);
    return (await r.text()).split('\n').some((b) => {
      const [h, n] = b.trim().split(':');
      return h === sisa && Number(n) > 0;
    });
  } catch {
    return false;
  }
}
