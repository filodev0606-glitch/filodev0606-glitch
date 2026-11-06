# Platform Kelas Online

Halaman proyek: [projects/platform-kelas-online.md](../../projects/platform-kelas-online.md)

| Berkas | Isi |
| :-- | :-- |
| `sandi.ts` | PBKDF2-SHA256 lewat WebCrypto, versi iterasi ikut tersimpan, bandingkan waktu konstan, cek sandi bocor dengan k-anonymity |
| `pembayaran.ts` | Lapisan `PaymentProvider`, tanda tangan HMAC pada webhook mutasi bank |
| `batas.ts` | Rate limit di tepi per pengguna atau IP, gagal-terbuka |
| `keamanan.ts` | CSP tanpa `unsafe-inline` untuk skrip, header keamanan |
