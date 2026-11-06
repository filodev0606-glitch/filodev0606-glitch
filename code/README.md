# Cuplikan kode

Potongan kecil dari tiap proyek, dipilih karena memperlihatkan keputusan teknis yang sebenarnya: keamanan, konsistensi data, dan penanganan kasus tepi. Bukan aplikasi utuh.

Semua cuplikan sudah dibersihkan dari rahasia, data klien, dan alamat surel. Beberapa dirapikan sedikit agar bisa dibaca tanpa konteks proyek. Berkas yang mengimpor modul lain (misalnya `utils.test.ts`) tidak bisa dijalankan sendirian.

| Folder | Proyek | Yang diperlihatkan |
| :-- | :-- | :-- |
| [filodev-control-center](filodev-control-center) | Panel admin dan buku tagihan | Verifikasi token Google, sesi ter-hash, CSRF, void pembayaran |
| [filokasir-filolaundry](filokasir-filolaundry) | SaaS kasir berlangganan | Aturan Firestore multi-tenant, siklus langganan |
| [palmera-pos](palmera-pos) | Kasir multi-outlet | Antrean sinkron, PIN bcrypt, izin per peran |
| [sistem-yayasan-sekolah](sistem-yayasan-sekolah) | Sistem sekolah | Migrasi Postgres dengan RLS, pembatasan login |
| [web-donasi-yayasan](web-donasi-yayasan) | Web donasi | Validasi Zod, kode unik, uang sebagai integer |
| [registrasi-umroh](registrasi-umroh) | Registrasi jamaah | Aturan Firestore dengan validasi bentuk data |
| [jam-kopi-kasir](jam-kopi-kasir) | Kasir roastery | Hitung harga dan stok dua jenis biji |
| [situs-filodev](situs-filodev) | Situs studio | Skrip build: kartu OG, perbaikan hasil ekspor |
| [platform-kelas-online](platform-kelas-online) | Platform kelas online | Hash sandi PBKDF2, webhook HMAC, rate limit, CSP |
| [showcase-3d-filodev](showcase-3d-filodev) | Situs showcase 3D | Hook animasi scroll, form kontak ke Supabase |
