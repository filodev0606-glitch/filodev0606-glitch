# Jam Kopi Kasir

Kasir untuk Jam Kopi Roastery, Pekanbaru.

## Arsitektur

```mermaid
flowchart LR
    subgraph APP["Aplikasi Flutter (Cubit)"]
        K["Kasir: penjualan, sesi, riwayat"]
        AD["Admin: semua fitur dan karyawan"]
        IN["Investor: dashboard dan laporan"]
    end
    APP --> FS[("Firestore")]
    RU["Aturan Firestore"] -.-> FS
    WEB["Konsol web: dashboard, laporan, keuangan"] --> FS
```

## Cara kerja

### 1. Masuk dan peran

```mermaid
flowchart TD
    L["Login Firebase Auth"] --> P{"Ada dokumen di users/uid?"}
    P -->|"tidak"| X["Ditolak"]
    P -->|"ya"| R{"Peran"}
    R -->|"admin"| A["Semua fitur"]
    R -->|"kasir"| K["Penjualan, sesi, riwayat"]
    R -->|"investor"| I["Dashboard dan laporan"]
```

### 2. Penjualan dan stok

```mermaid
sequenceDiagram
    participant K as Kasir
    participant A as Aplikasi
    participant F as Firestore
    K->>A: Tambah ke keranjang
    K->>A: Checkout
    A->>F: Simpan penjualan dan kurangi stok
    Note over F: Aturan: kasir hanya boleh mengurangi stok saat checkout
    F-->>A: Berhasil
```

## Peran

| Peran | Akses |
| :-- | :-- |
| Admin | Semua fitur, termasuk mengelola karyawan |
| Kasir | Penjualan, sesi kasir, riwayat |
| Investor | Dashboard dan laporan; keuangan di web |

## Keputusan teknis

**Akun tanpa profil ditolak.** Akun baru harus punya dokumen di koleksi `users` yang dibuat admin. Membuat akun saja tidak memberi akses.

**Aturan stok di database.** Kasir hanya boleh mengurangi stok saat checkout, ditegakkan aturan Firestore.

**Web untuk laporan saja.** Konsol web hanya menampilkan dashboard, laporan, dan keuangan, bukan kasir penuh, sehingga permukaan yang terbuka lebih kecil.

**Skrip untuk lingkungan.** Data awal, deploy aturan, dan emulator lokal (Auth dan Firestore) dijalankan dengan skrip.

## Stack

Flutter, Cubit, Firestore, Firebase Auth, Firebase Hosting

## Cuplikan kode

[code/jam-kopi-kasir](../code/jam-kopi-kasir)
