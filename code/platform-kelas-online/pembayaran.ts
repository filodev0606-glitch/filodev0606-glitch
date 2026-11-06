import { nilai } from './pengaturan';

/** Hasil baca webhook dari penyedia mutasi bank, dinormalkan agar penyedia bisa diganti. */
export type MutasiMasuk = { ref: string; nominal: number };

export interface PaymentProvider {
  nama: string;
  /** Verifikasi keaslian + ubah payload menjadi MutasiMasuk. Null = tolak. */
  baca(request: Request, bodyMentah: string): Promise<MutasiMasuk[] | null>;
}

const enc = new TextEncoder();

function hexKeBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null;
  return Uint8Array.from(hex.match(/../g)!, (h) => parseInt(h, 16));
}

/** Penyedia generik: tanda tangan HMAC-SHA256 hex dari body mentah pada header x-signature. */
export const penyediaGenerik: PaymentProvider = {
  nama: 'generik',
  async baca(request, bodyMentah) {
    const rahasia = nilai('mutasi_rahasia');
    if (!rahasia) return null;
    const sig = hexKeBytes((request.headers.get('x-signature') ?? '').trim());
    if (!sig) return null;
    const kunci = await crypto.subtle.importKey('raw', enc.encode(rahasia), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    // verify() membandingkan dengan waktu konstan.
    if (!(await crypto.subtle.verify('HMAC', kunci, sig, enc.encode(bodyMentah)))) return null;
    try {
      const data = JSON.parse(bodyMentah);
      const daftar = Array.isArray(data) ? data : [data];
      const hasil: MutasiMasuk[] = [];
      for (const m of daftar) {
        if (m?.tipe !== 'masuk') continue;
        if (typeof m.ref !== 'string' || !m.ref || m.ref.length > 120) return null;
        if (!Number.isInteger(m.nominal) || m.nominal <= 0) return null;
        hasil.push({ ref: m.ref, nominal: m.nominal });
      }
      return hasil;
    } catch {
      return null;
    }
  },
};

export const infoBank = () => ({
  nama: nilai('bank_nama'),
  rekening: nilai('bank_rekening'),
  atasNama: nilai('bank_atas_nama'),
  siap: Boolean(nilai('bank_nama') && nilai('bank_rekening') && nilai('bank_atas_nama')),
});
