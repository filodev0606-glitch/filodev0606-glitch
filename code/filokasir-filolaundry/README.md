# FiloKasir dan FiloLaundry

Halaman proyek: [projects/filokasir-filolaundry.md](../../projects/filokasir-filolaundry.md)

| Berkas | Isi |
| :-- | :-- |
| `firestore.rules` | Isolasi per `tenantId`, kasir hanya menyentuh data cabangnya, field langganan tidak bisa diubah klien. Surel admin diganti placeholder |
| `subscription_lifecycle.js` | Transisi status `active`, `grace`, `expired`. Endpoint verifikasi Play sudah dipensiunkan, alur aktif adalah QRIS dengan persetujuan admin |
