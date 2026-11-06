# Muhammad Ilham Rantri

Software developer. Aplikasi Android (Flutter) dan web. Kampar, Riau (UTC+7).

Sejak 2022 saya membangun perangkat lunak operasional untuk usaha kecil dan menengah: kasir multi-outlet, sistem sekolah dan yayasan, serta panel admin web. Studio saya Filodev. Sistem yang saya kerjakan umumnya harus tetap berjalan tanpa koneksi stabil, punya batas akses per peran, dan bisa diserahkan ke orang lain dengan dokumentasi yang cukup.

Terbuka untuk kerja remote (zona waktu UTC+7). Bahasa kerja: Indonesia. Paling sesuai untuk pengembangan aplikasi Flutter, backend ringan di Firebase, Supabase, atau Cloudflare, dan sistem operasional untuk usaha kecil dan menengah.

## Karya terpilih

| Proyek | Ranah | Stack |
| :-- | :-- | :-- |
| [FiloKasir dan FiloLaundry](projects/filokasir-filolaundry.md) | SaaS kasir berlangganan, Android dan Windows | Flutter, Firebase, SQLite, QRIS |
| [Palmera POS](projects/palmera-pos.md) | Kasir multi-outlet | Flutter, Riverpod, Firestore, SQLite |
| [Sistem Yayasan dan Sekolah](projects/sistem-yayasan-sekolah.md) | Akademik, keuangan, PPDB | Next.js 16, Supabase, Tailwind |
| [Filodev Control Center](projects/filodev-control-center.md) | Panel admin dan buku tagihan | Cloudflare Workers, D1 |
| [Web Donasi Yayasan](projects/web-donasi-yayasan.md) | Donasi dan wakaf | Astro 5, Workers, D1, R2 |
| [Registrasi Jamaah Umroh](projects/registrasi-umroh.md) | Pendaftaran dan dashboard cabang | React, Vite, Firebase |
| [Jam Kopi Kasir](projects/jam-kopi-kasir.md) | Kasir roastery | Flutter, Cubit, Firestore |
| [Situs Filodev](projects/situs-filodev.md) | Situs studio dua bahasa | Next.js 16, Firebase Hosting |
| [Platform Kelas Online](projects/platform-kelas-online.md) | Kelas, live, kuis, sertifikat, tiga bahasa | Astro, Workers, D1, WebRTC |
| [Contoh Web dan Template](projects/contoh-web-dan-template.md) | Template yayasan, showcase 3D, landing page | Astro, Next.js, Three.js |

Di Google Play: AI Kasir dan Takmuru Quran.

Cuplikan kode dari tiap proyek ada di [code/](code).

## Stack

| Lapisan | Yang saya pakai |
| :-- | :-- |
| Mobile | Flutter, Dart, Riverpod, Cubit, go_router, SQLite |
| Web | Next.js, React, TypeScript, Astro, Vite, Tailwind CSS |
| Backend | Cloudflare Workers, D1, R2, Firebase (Firestore, Auth, Functions), Supabase |
| Data | Drizzle ORM, Zod, aturan keamanan Firestore |
| Uji | Vitest, Playwright, flutter test |
| Pembayaran | Verifikasi webhook HMAC, QRIS dengan persetujuan admin, kode unik transfer |

## Pola yang berulang di proyek saya

- **Offline-first.** Data ditulis ke SQLite lebih dulu, lalu disinkronkan lewat antrean. Idempotensi memakai ID lokal, konflik diselesaikan dengan last-write-wins berdasarkan `updatedAt`.
- **Isolasi data per tenant.** Setiap dokumen membawa `tenantId`, dan aturan database yang menegakkannya, bukan hanya kode aplikasi.
- **Operasional murah.** Saya memilih platform yang tidak butuh server yang dijaga: Workers dan D1, Firebase, Supabase, hosting statis.
- **Admin yang aman.** Sesi disimpan sebagai hash, aksi tulis diberi perlindungan CSRF, dan setiap perubahan data tercatat di log audit. Data keuangan dikoreksi dengan pembatalan, bukan penghapusan.
- **Serah terima.** Proyek disertai PRD, catatan `HANDOFF`, panduan deploy, SOP admin, dan checklist UAT.

## Kontak

- Surel: filodev0606@gmail.com
- WhatsApp: [+62 853-6361-5165](https://wa.me/6285363615165)
- LinkedIn: https://www.linkedin.com/in/muhammad-ilham-rantri-293769448/
- Situs: https://filodev-web.web.app

English summary: [README.en.md](README.en.md)
