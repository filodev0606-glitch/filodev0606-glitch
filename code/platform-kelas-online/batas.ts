import { env } from 'cloudflare:workers';

// Rate limit di tepi (binding Workers Rate Limiting): jalan juga di *.workers.dev, tanpa domain/WAF.
// Binding opsional: tanpa binding (dev/tes) semua permintaan lolos.
type Kelompok = 'tulis' | 'baca' | 'auth';

const TANPA_BATAS = ['/api/webhook/', '/api/telegram']; // dilindungi HMAC / rahasia Telegram; IP penyedia dipakai bersama

export function kelompokBatas(metode: string, path: string): Kelompok | null {
  if (!path.startsWith('/api/') && !path.startsWith('/verifikasi') && !/^\/(en|ar)\/verifikasi/.test(path)) return null;
  if (TANPA_BATAS.some((p) => path.startsWith(p))) return null;
  if (path.startsWith('/api/auth/')) return 'auth';
  return metode === 'GET' || metode === 'HEAD' ? 'baca' : 'tulis';
}

/** true = lolos. Kunci: pengguna bila sudah login (IP bersama sekolah/CGNAT tidak saling mengunci), selain itu IP. */
export async function lolosBatas(kelompok: Kelompok, ip: string | null, userId: string | null): Promise<boolean> {
  const pengikat = kelompok === 'auth' ? env.BATAS_AUTH : kelompok === 'tulis' ? env.BATAS_TULIS : env.BATAS_BACA;
  if (!pengikat) return true;
  try {
    const { success } = await pengikat.limit({ key: `${kelompok}:${userId ?? ip ?? 'anon'}` });
    return success;
  } catch {
    return true; // gagal-terbuka: gangguan layanan batas tidak boleh menjatuhkan situs
  }
}
