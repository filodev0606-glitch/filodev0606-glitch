# Palmera POS

Kasir multi-outlet untuk Palmera Kebab & Shawarma. Owner, admin cabang, dan kasir memakai satu aplikasi Android.

## Konteks

Beberapa outlet harus dikontrol dari pusat, sementara kasir di tiap outlet tetap harus bisa berjualan saat koneksi putus.

## Arsitektur

```mermaid
flowchart LR
    subgraph APK["Satu aplikasi Android"]
        UI["Owner, Admin cabang, Kasir"] --> S["packages/shared: domain, data, provider"]
        S --> DB[("SQLite lokal")]
    end
    DB -->|"antrean sinkron"| FS[("Firestore")]
    R["Aturan Firestore"] -.->|"membatasi akses"| FS
```

## Cara kerja

### 1. Hierarki peran

```mermaid
flowchart TD
    O["Owner pusat"] -->|"membuat"| A["Admin cabang"]
    O -->|"membuat"| K["Kasir"]
    A -->|"mengelola"| K
    O -->|"melihat semua outlet"| ALL["Semua cabang"]
    A -->|"hanya cabangnya"| ONE["Satu outlet"]
```

### 2. Alur harian di outlet

```mermaid
flowchart LR
    S["Setup outlet: perangkat diikat ke cabang"] --> P["Kasir masuk dengan PIN 4 digit"]
    P --> B["Buka shift"]
    B --> J["Jual"]
    J --> L[("SQLite")]
    L -->|"online"| F[("Firestore")]
    J --> T["Tutup shift"]
```

## Struktur

Monorepo Flutter dengan Melos.

```
apps/pos_tablet     aplikasi Android
packages/shared     domain, data, tema, provider
firebase/           aturan Firestore, indeks, data awal
docs/               checklist UAT, panduan go-live
scripts/            build APK, deploy
```

## Keputusan teknis

**Satu aplikasi untuk tiga peran.** Distribusi dan pembaruan jadi satu jalur, dan kode domain di `packages/shared` tidak diduplikasi.

**Perangkat diikat ke outlet.** Saat setup, perangkat dipasangkan ke cabang. Kasir masuk dengan PIN 4 digit unik lalu membuka shift.

**PIN disimpan sebagai hash bcrypt.** Bcrypt sengaja lambat dihitung, sehingga PIN sulit ditebak dengan percobaan massal.

**Berjalan di paket gratis.** Backend hanya Firestore dan Auth anonim, tanpa Cloud Functions. Logika yang butuh server ditaruh di aturan database atau di aplikasi. Cloud Functions disiapkan sebagai opsi bila nanti pindah ke paket berbayar.

**Offline-first.** Cache SQLite dan antrean sinkron ke Firestore.

## Stack

Flutter 3, Material 3, Riverpod, go_router, SQLite, Firestore, bcrypt, Melos

## Operasional

Skrip build APK (bootstrap, uji, build, salin ke `dist/`), skrip deploy aturan dan indeks, dan checklist UAT per outlet.

## Cuplikan kode

[code/palmera-pos](../code/palmera-pos)
