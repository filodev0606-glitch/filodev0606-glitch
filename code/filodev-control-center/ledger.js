// Buku tagihan hub: daftar klien berbayar dan riwayat pembayaran manual.
// Status jeda/langganan tiap app tetap di backend app itu sendiri; ini hanya
// catatan "siapa membayar berapa untuk berapa bulan".

import { catatAudit } from './auth.js';
import { AppError, readJson } from './util.js';

const ID_KLIEN = /^[a-z0-9][a-z0-9_-]{1,39}$/;
const APP_SAH = new Set(['palmera', 'aikasir']);

function int(v, nama, { min = 0, max = 1e10 } = {}) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new AppError('invalid-argument', `${nama} harus bilangan bulat ${min}–${max}.`);
  }
  return n;
}

function teks(v, maks, { wajib = false, nama = 'Isian' } = {}) {
  const s = String(v ?? '').trim();
  if (wajib && !s) throw new AppError('invalid-argument', `${nama} wajib diisi.`);
  return s.slice(0, maks) || null;
}

export async function daftarKlien(env) {
  const rows = await env.DB.prepare(
    'SELECT k.*, ' +
      '(SELECT COUNT(*) FROM pembayaran p WHERE p.klien_id = k.id AND p.batal_at IS NULL) AS jumlah_bayar, ' +
      '(SELECT COALESCE(SUM(jumlah), 0) FROM pembayaran p WHERE p.klien_id = k.id AND p.batal_at IS NULL) AS total_bayar, ' +
      '(SELECT MAX(at) FROM pembayaran p WHERE p.klien_id = k.id AND p.batal_at IS NULL) AS terakhir_bayar ' +
      'FROM klien k ORDER BY k.created_at ASC'
  ).all();
  return { klien: rows.results };
}

/**
 * Buat atau perbarui klien (upsert menurut id).
 * `lunas_sampai` (ms, atau null untuk menghapus jadwal) dan `grace_days` hanya diubah bila dikirim;
 * tab app (Palmera) mengirimnya agar buku hub ikut jadwal yang tertulis di backend app.
 */
export async function simpanKlien(env, email, body, sekarang = Date.now()) {
  const id = String(body?.id || '').trim();
  if (!ID_KLIEN.test(id)) throw new AppError('invalid-argument', 'ID klien tidak valid (huruf kecil, angka, - atau _).');
  const app = String(body?.app || '');
  if (!APP_SAH.has(app)) throw new AppError('invalid-argument', 'App tidak dikenal.');
  const nama = teks(body.nama, 80, { wajib: true, nama: 'Nama klien' });
  const wa = teks(body.kontak_wa, 20);
  const harga = int(body.harga_per_bulan ?? 0, 'Harga per bulan', { max: 1e9 });
  const catatan = teks(body.catatan, 300);

  const adaLunas = body.lunas_sampai !== undefined;
  const lunas =
    adaLunas && body.lunas_sampai !== null
      ? int(body.lunas_sampai, 'Lunas sampai', { min: sekarang - 5 * 366 * 864e5, max: sekarang + 5 * 366 * 864e5 })
      : null;
  const adaGrace = body.grace_days !== undefined;
  const grace = adaGrace ? int(body.grace_days, 'Masa tenggang', { max: 30 }) : 3;

  await env.DB.prepare(
    'INSERT INTO klien (id, app, nama, kontak_wa, harga_per_bulan, catatan, created_at, lunas_sampai, grace_days) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET nama = excluded.nama, kontak_wa = excluded.kontak_wa, ' +
      'harga_per_bulan = excluded.harga_per_bulan, catatan = excluded.catatan, ' +
      'lunas_sampai = CASE WHEN ? THEN excluded.lunas_sampai ELSE klien.lunas_sampai END, ' +
      'grace_days = CASE WHEN ? THEN excluded.grace_days ELSE klien.grace_days END'
  )
    .bind(id, app, nama, wa, harga, catatan, sekarang, lunas, grace, adaLunas ? 1 : 0, adaGrace ? 1 : 0)
    .run();
  await catatAudit(env, email, app, 'simpan_klien', id, { harga_per_bulan: harga });
  return { ok: true, id };
}

export async function daftarPembayaran(env, klienId) {
  const sql =
    'SELECT p.*, k.nama AS klien_nama, k.app FROM pembayaran p LEFT JOIN klien k ON k.id = p.klien_id ' +
    (klienId ? 'WHERE p.klien_id = ? ' : '') +
    'ORDER BY p.at DESC, p.id DESC LIMIT 500';
  const stmt = env.DB.prepare(sql);
  const rows = klienId ? await stmt.bind(klienId).all() : await stmt.all();
  return { pembayaran: rows.results };
}

/**
 * Catat satu pembayaran. `lunas_sampai` (ms) opsional: bila ada, klien diperbarui
 * ke tanggal itu (browser sudah lebih dulu menulis tanggal yang sama ke backend app).
 */
export async function catatPembayaran(env, email, body, sekarang = Date.now()) {
  const klienId = String(body?.klien_id || '').trim();
  const klien = await env.DB.prepare('SELECT id, app FROM klien WHERE id = ?').bind(klienId).first();
  if (!klien) throw new AppError('not-found', 'Klien belum terdaftar di hub.', 404);

  const jumlah = int(body.jumlah, 'Jumlah', { max: 1e10 });
  const bulan = int(body.bulan, 'Jumlah bulan', { min: 1, max: 36 });
  const metode = teks(body.metode, 40);
  const catatan = teks(body.catatan, 300);
  let lunasSampai = null;
  if (body.lunas_sampai !== undefined && body.lunas_sampai !== null) {
    lunasSampai = int(body.lunas_sampai, 'Lunas sampai', { min: sekarang - 366 * 864e5, max: sekarang + 5 * 366 * 864e5 });
  }

  await env.DB.prepare('INSERT INTO pembayaran (klien_id, at, jumlah, bulan, metode, catatan) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(klienId, sekarang, jumlah, bulan, metode, catatan)
    .run();
  if (lunasSampai !== null) {
    await env.DB.prepare('UPDATE klien SET lunas_sampai = ? WHERE id = ?').bind(lunasSampai, klienId).run();
  }
  await catatAudit(env, email, klien.app, 'catat_pembayaran', klienId, { jumlah, bulan, lunas_sampai: lunasSampai });
  return { ok: true };
}

/** Membatalkan (void) satu pembayaran yang salah catat. Tidak menghapus baris dan tidak mengubah akses klien. */
export async function batalkanPembayaran(env, email, body, sekarang = Date.now()) {
  const id = int(body?.id, 'ID pembayaran', { min: 1 });
  const alasan = teks(body.alasan, 200, { wajib: true, nama: 'Alasan' });
  if (alasan.length < 5) throw new AppError('invalid-argument', 'Alasan minimal 5 karakter.');
  const baris = await env.DB.prepare('SELECT p.id, p.klien_id, p.jumlah, p.batal_at, k.app FROM pembayaran p LEFT JOIN klien k ON k.id = p.klien_id WHERE p.id = ?')
    .bind(id)
    .first();
  if (!baris) throw new AppError('not-found', 'Pembayaran tidak ditemukan.', 404);
  if (baris.batal_at) throw new AppError('failed-precondition', 'Pembayaran ini sudah dibatalkan.', 412);
  await env.DB.prepare('UPDATE pembayaran SET batal_at = ?, batal_alasan = ? WHERE id = ? AND batal_at IS NULL')
    .bind(sekarang, alasan, id)
    .run();
  await catatAudit(env, email, baris.app || 'hub', 'batal_pembayaran', baris.klien_id, { id, jumlah: baris.jumlah });
  return { ok: true };
}

/** Bulan kalender WIB (UTC+7) dari ms epoch, "YYYY-MM". */
export const bulanWib = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 7);

/** Ringkasan pendapatan: 12 bulan terakhir (WIB), bulan ini, dan total. Pembayaran batal tidak dihitung. */
export async function ringkasanTagihan(env, sekarang = Date.now()) {
  const rows = await env.DB.prepare(
    // GROUP BY 1, bukan nama alias: kolom `bulan` (jumlah bulan dibayar) ikut ada di tabel dan menang atas alias.
    "SELECT strftime('%Y-%m', at / 1000, 'unixepoch', '+7 hours') AS periode, SUM(jumlah) AS jumlah, COUNT(*) AS n " +
      'FROM pembayaran WHERE batal_at IS NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 12'
  ).all();
  const total = await env.DB.prepare('SELECT COALESCE(SUM(jumlah), 0) AS total, COUNT(*) AS n FROM pembayaran WHERE batal_at IS NULL').first();
  const bulanIni = bulanWib(sekarang);
  const perBulan = rows.results.map((r) => ({ bulan: r.periode, jumlah: r.jumlah, n: r.n }));
  const ini = perBulan.find((r) => r.bulan === bulanIni);
  return {
    bulan_ini: bulanIni,
    pendapatan_bulan_ini: ini ? ini.jumlah : 0,
    pembayaran_bulan_ini: ini ? ini.n : 0,
    total: total.total,
    jumlah_pembayaran: total.n,
    per_bulan: perBulan,
  };
}

/** Penangan /api/klien dan /api/pembayaran. Mengembalikan undefined bila bukan rutenya. */
export async function tanganiLedger(env, request, url, email) {
  const jalur = url.pathname;
  const metode = request.method;
  if (jalur === '/api/klien' && metode === 'GET') return daftarKlien(env);
  if (jalur === '/api/klien' && metode === 'POST') return simpanKlien(env, email, await readJson(request));
  if (jalur === '/api/pembayaran' && metode === 'GET') {
    const k = url.searchParams.get('klien');
    return daftarPembayaran(env, k && ID_KLIEN.test(k) ? k : null);
  }
  if (jalur === '/api/pembayaran' && metode === 'POST') return catatPembayaran(env, email, await readJson(request));
  if (jalur === '/api/pembayaran/batal' && metode === 'POST') return batalkanPembayaran(env, email, await readJson(request));
  if (jalur === '/api/tagihan' && metode === 'GET') return ringkasanTagihan(env);
  return undefined;
}
