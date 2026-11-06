# Palmera POS

Halaman proyek: [projects/palmera-pos.md](../../projects/palmera-pos.md)

Palmera adalah proyek berlisensi tertutup. Yang ditampilkan hanya utilitas generik yang tidak memuat logika bisnis klien.

| Berkas | Isi |
| :-- | :-- |
| `sync_queue.dart`, `sync_enqueue.dart` | Antrean sinkron dengan ID unik per pekerjaan, flush segera untuk penghapusan |
| `conflict_resolver.dart` | Penentuan status order saat server melaporkan konflik stok |
| `pin_hasher.dart` | PIN 4 digit disimpan sebagai hash bcrypt |
| `permission_checker.dart` | Peta izin per peran |
| `order_number_generator.dart` | Nomor order harian per outlet |
