# Filodev Control Center

Backend panel admin di Cloudflare Workers dengan D1. Halaman proyek: [projects/filodev-control-center.md](../../projects/filodev-control-center.md)

| Berkas | Isi |
| :-- | :-- |
| `auth.js` | Verifikasi ID token Google (RS256 lewat JWKS), sesi disimpan sebagai hash, pemeriksaan CSRF dan Origin, atribut cookie |
| `ledger.js` | Klien dan pembayaran. Pembayaran tidak dihapus, hanya dibatalkan dengan alasan. Ringkasan memakai hari WIB |
| `util.js` | `AppError`, header JSON, `sha256Hex`, base64url, pembaca body |
| `schema.sql` | Tabel sesi, audit, klien, dan pembayaran |
