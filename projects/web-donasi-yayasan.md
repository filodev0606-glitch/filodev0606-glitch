# Web Donasi Yayasan

Situs donasi dan wakaf untuk sebuah yayasan sosial, dengan panel admin.

## Konteks

Yayasan menerima donasi lewat transfer manual. Mereka butuh cara mencocokkan pembayaran, menerbitkan kuitansi, dan menampilkan kegiatan, dengan biaya server yang rendah.

## Arsitektur

```mermaid
flowchart LR
    B["Peramban: donatur dan admin"] --> W["Astro SSR di Cloudflare Workers"]
    W --> D[("D1: donasi, program, pengguna, audit")]
    W --> R[("R2: foto dan video")]
    C["Worker cron"] --> D
    C -->|"pengingat"| E["Resend (opsional)"]
    T["Turnstile dan rate limit"] -.->|"melindungi form publik"| W
```

## Cara kerja

### 1. Alur donasi manual

```mermaid
sequenceDiagram
    participant Do as Donatur
    participant W as Web
    participant D as D1
    participant A as Admin
    Do->>W: Isi form (Turnstile)
    W->>D: Simpan donasi dengan kode unik
    W-->>Do: Nominal transfer, termasuk kode unik
    Do->>Do: Transfer manual
    A->>D: Cocokkan nominal lalu verifikasi
    D-->>Do: Kuitansi
```

Verifikasi bisa dibatalkan. Donatur bisa memulihkan akses ke kuitansinya.

### 2. Pekerjaan terjadwal

```mermaid
flowchart LR
    C["Worker cron"] --> X["Donasi yang kedaluwarsa"]
    C --> BK["Backup"]
    C --> RM["Pengingat"]
    X --> D[("D1")]
    BK --> D
    RM -->|"email"| E["Resend"]
```

### 3. Unggah galeri

```mermaid
flowchart LR
    U["Admin unggah media"] --> T{"Jenis"}
    T -->|"foto"| K["Kompres otomatis"] --> R[("R2")]
    T -->|"video"| V["Unggah bertahap"] --> R
    T -->|"tautan"| EM["Embed YouTube, Instagram, TikTok"]
```

## Struktur

Monorepo dengan tiga bagian.

```
apps/web          Astro: halaman publik, admin, API
packages/db       skema Drizzle, migrasi, helper D1
packages/shared   utilitas dan validasi Zod
docs/             DEPLOY.md, SOP-ADMIN.md
```

## Keputusan teknis

**Kode unik pada nominal transfer.** Pembayaran manual dicocokkan dari nominalnya. Admin memverifikasi atau membatalkan verifikasi.

**Astro SSR di Workers dengan D1 dan R2.** Tidak ada server yang dijaga, dan biaya mengikuti pemakaian.

**Form publik berlapis.** Turnstile dan rate limit pada semua form.

**Pekerjaan terjadwal dipisah.** Worker cron mengurus kedaluwarsa, backup, dan pengingat.

**Audit terpusat.** Semua aksi admin tercatat di satu tempat.

## Fitur lain

Galeri dengan urutan seret-lepas dan jadwal tayang. PWA, JSON-LD, gambar OG dinamis. Tabel admin yang nyaman di layar HP.

## Stack

Astro 5, Cloudflare Workers, D1, R2, Drizzle ORM, Zod, Turnstile, Resend

## Pengujian

`npm run verify` menjalankan pengecekan tipe, ESLint, dan 31 tes unit dan integrasi dengan D1. Tes end-to-end Playwright memakai profil iPhone dan Pixel.
