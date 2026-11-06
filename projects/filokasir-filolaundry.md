# FiloKasir dan FiloLaundry

SaaS kasir untuk laundry dan toko. Dua aplikasi Android dari satu kode dan satu backend, ditambah aplikasi admin Windows untuk mengelola semua pelanggan.

## Konteks

Pemilik usaha kecil butuh kasir yang tetap bisa dipakai saat internet mati, mendukung beberapa cabang, dan punya cara membayar langganan yang bisa diaktifkan dari satu panel admin.

## Arsitektur

```mermaid
flowchart LR
    subgraph HP["Perangkat Android"]
        A["Owner dan kasir"] --> B[("SQLite lokal")]
    end
    B -->|"antrean sinkron"| C[("Firestore")]
    A -->|"klaim bayar QRIS"| C
    F["Admin Windows"] -->|"setujui klaim"| E["Cloud Functions"]
    E --> C
```

## Cara kerja

### 1. Transaksi offline lalu sinkron

```mermaid
sequenceDiagram
    participant K as Kasir
    participant L as SQLite
    participant Q as Antrean sinkron
    participant F as Firestore
    K->>L: Simpan order (localId)
    L->>Q: Masuk antrean
    Note over Q: Internet mati, order tetap tersimpan
    Q->>F: Kirim saat online (upsert by localId)
    F-->>Q: Berhasil
    Note over Q,F: Konflik: last-write-wins berdasarkan updatedAt
```

### 2. Langganan lewat QRIS dan persetujuan admin

```mermaid
sequenceDiagram
    participant O as Owner
    participant A as Aplikasi
    participant F as Firestore
    participant M as Admin Windows
    participant C as Cloud Functions
    O->>A: Bayar langganan lewat QRIS
    A->>C: Kirim klaim langganan (menunggu)
    C->>F: Simpan klaim
    M->>F: Periksa klaim
    M->>C: Setujui klaim
    C->>F: Status aktif dan tanggal berakhir
```

Klien tidak menulis klaim maupun status langganan secara langsung. Aturan Firestore menutup keduanya, sehingga hanya fungsi di server yang mengubahnya.

Kode Google Play Billing (verifikasi pembelian dan notifikasi RTDN) sudah ditulis, tetapi dipensiunkan dan tidak aktif. Fungsinya dijawab dengan HTTP 410, dan yang berjalan sekarang adalah QRIS dengan persetujuan admin.

### 3. Siklus status tenant

```mermaid
stateDiagram-v2
    [*] --> trial: Daftar lewat Google (30 hari)
    trial --> active: Klaim disetujui
    trial --> expired: Habis tanpa bayar
    active --> grace: Masa berlaku habis
    grace --> active: Klaim disetujui
    grace --> expired: Masa tenggang habis
    expired --> active: Klaim disetujui
    active --> suspended: Admin menangguhkan
    suspended --> active: Admin mengaktifkan
```

Saat `expired`, aplikasi tidak bisa membuat order baru.

## Keputusan teknis

**Satu project Firebase untuk dua produk.** Data dipisah dengan `tenantId` dan `productId`. Admin cukup mengelola satu backend dan satu set aturan. Konsekuensinya aturan Firestore harus ketat, karena isolasi bergantung padanya.

**Dua aplikasi dari satu kode.** Flutter flavor menghasilkan FiloLaundry dan FiloKasir dari satu basis kode. Perbaikan di satu produk langsung berlaku di yang lain.

**Status langganan hanya diubah server.** Field langganan dilindungi aturan Firestore dan hanya Cloud Functions yang boleh menulisnya. Klien tidak dipercaya untuk status ini.

**Masa tenggang.** Setelah masa berlaku habis ada beberapa hari `grace` sebelum `expired`, supaya pelanggan tidak terkunci mendadak.

**Gerbang langganan memakai tanggal tersimpan.** Aplikasi tidak bisa dibuka kembali hanya dengan mematikan internet.

**Sinkron tanpa duplikat.** Setiap transaksi punya `localId`. Last-write-wins cukup untuk kasir yang mengubah data cabangnya sendiri.

**Login kasir dengan PIN.** Owner memasangkan perangkat ke cabang sekali. Setelah itu kasir hanya memasukkan PIN dan hanya melihat data cabangnya.

## Cakupan

- Owner: daftar lewat Google, masa percobaan 30 hari otomatis, kelola cabang dan kasir, laporan semua cabang.
- Kasir: order kiloan dan satuan, antrean, pembayaran tunai, transfer, QRIS, dan utang dengan DP, struk, shift, kas.
- Admin Windows: perpanjang, tangguhkan, atur harga, pindahkan produk.

## Stack

Flutter, Dart, SQLite, Firebase Auth, Firestore, Cloud Functions (Node.js)

## Status

PRD, rencana, dan panduan setup tersedia di repositori proyek (privat).

## Cuplikan kode

[code/filokasir-filolaundry](../code/filokasir-filolaundry)
