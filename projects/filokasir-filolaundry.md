# FiloKasir dan FiloLaundry

SaaS kasir untuk laundry dan toko. Dua aplikasi Android dari satu kode dan satu backend, ditambah aplikasi admin Windows untuk mengelola semua pelanggan.

## Konteks

Pemilik usaha kecil butuh kasir yang tetap bisa dipakai saat internet mati, mendukung beberapa cabang, dan bisa ditagih bulanan tanpa transfer manual.

## Arsitektur

```mermaid
flowchart LR
    subgraph HP["Perangkat Android"]
        A["Owner dan kasir"] --> B[("SQLite lokal")]
    end
    B -->|"antrean sinkron"| C[("Firestore")]
    A -->|"langganan"| D["Google Play Billing"]
    D -->|"verifikasi dan notifikasi RTDN"| E["Cloud Functions"]
    E --> C
    F["Admin Windows"] --> C
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

### 2. Langganan bulanan

```mermaid
sequenceDiagram
    participant O as Owner
    participant A as Aplikasi
    participant P as Google Play
    participant C as Cloud Functions
    participant F as Firestore
    O->>A: Berlangganan
    A->>P: Beli (SKU per produk)
    P-->>A: Token pembelian
    A->>C: verifyPlayPurchase
    C->>P: Validasi token
    C->>F: Status aktif dan tanggal berakhir
    P-->>C: RTDN (perpanjang atau batal)
    C->>F: Perbarui status
```

### 3. Siklus status tenant

```mermaid
stateDiagram-v2
    [*] --> trial: Daftar lewat Google (30 hari)
    trial --> active: Bayar
    trial --> expired: Habis tanpa bayar
    active --> expired: Masa berlaku habis
    expired --> active: Bayar
    active --> suspended: Admin menangguhkan
    suspended --> active: Admin mengaktifkan
```

Saat `expired`, aplikasi tidak bisa membuat order baru.

## Keputusan teknis

**Satu project Firebase untuk dua produk.** Data dipisah dengan `tenantId` dan `productId`. Admin cukup mengelola satu backend dan satu set aturan. Konsekuensinya aturan Firestore harus ketat, karena isolasi bergantung padanya.

**Dua aplikasi dari satu kode.** Flutter flavor menghasilkan FiloLaundry dan FiloKasir dari satu basis kode. Perbaikan di satu produk langsung berlaku di yang lain.

**Langganan diverifikasi di server.** Pembelian dari Play dicek di Cloud Functions, dan perpanjangan mengikuti notifikasi real-time dari Play. Status langganan tidak dipercaya dari klien.

**Gerbang langganan memakai tanggal tersimpan.** Aplikasi tidak bisa dibuka kembali hanya dengan mematikan internet.

**Sinkron tanpa duplikat.** Setiap transaksi punya `localId`. Last-write-wins cukup untuk kasir yang mengubah data cabangnya sendiri.

**Login kasir dengan PIN.** Owner memasangkan perangkat ke cabang sekali. Setelah itu kasir hanya memasukkan PIN dan hanya melihat data cabangnya.

## Cakupan

- Owner: daftar lewat Google, masa percobaan 30 hari otomatis, kelola cabang dan kasir, laporan semua cabang.
- Kasir: order kiloan dan satuan, antrean, pembayaran tunai, transfer, QRIS, dan utang dengan DP, struk, shift, kas.
- Admin Windows: perpanjang, tangguhkan, atur harga, pindahkan produk.

## Stack

Flutter, Dart, SQLite, Firebase Auth, Firestore, Cloud Functions (Node.js), Google Play Billing

## Status

PRD, rencana, dan panduan setup tersedia di repositori proyek (privat).
