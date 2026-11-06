# Sistem Yayasan dan Sekolah

Aplikasi web untuk yayasan dengan beberapa jenjang sekolah. Dirancang mobile-first karena sebagian besar guru memakainya lewat HP.

## Konteks

Yayasan dengan beberapa jenjang butuh satu sistem untuk absensi, nilai, keuangan, dan komunikasi ke orang tua, dengan hak akses yang berbeda untuk tiap jabatan.

## Arsitektur

```mermaid
flowchart LR
    U["Peramban atau HP"] --> N["Next.js 16 (Vercel)"]
    N --> SA["Supabase Auth"]
    N --> DB[("Supabase Postgres")]
    N --> ST[("Supabase Storage: berkas PPDB, foto")]
    N -->|"foto lembar tulisan tangan"| G["Gemini API"]
```

## Cara kerja

### 1. Peran dan akses

```mermaid
flowchart TD
    Y["Yayasan"] -->|"semua sekolah"| M1["Keuangan, gaji, pajak, laporan lintas sekolah"]
    SY["Staf yayasan"] --> M2["Operasional yayasan, SDM"]
    KS["Kepala sekolah"] -->|"sekolahnya"| M3["Absensi, nilai, jadwal, ujian"]
    G["Guru"] -->|"kelasnya"| M4["Absen, nilai, program mengaji"]
    OT["Orang tua"] -->|"tautan bertoken"| M5["Perkembangan satu anak"]
```

### 2. Akses orang tua tanpa akun

```mermaid
sequenceDiagram
    participant O as Orang tua
    participant W as Next.js
    participant D as Postgres
    O->>W: Buka /progress/token
    W->>D: Cari anak dengan token ini
    D-->>W: Data satu anak
    W-->>O: Nilai, absensi, capaian mengaji
```

### 3. Input dari foto

```mermaid
flowchart LR
    F["Guru memotret lembar nilai atau absen"] --> S["Server Next.js"]
    S --> G["Gemini API membaca tulisan"]
    G --> D["Nilai, absen, capaian mengaji"]
    D --> DB[("Postgres")]
```

### 4. PPDB online

```mermaid
flowchart LR
    P["Calon siswa: /ppdb, form dan unggah berkas"] --> T["Token status"]
    P --> DB[("Postgres dan Storage")]
    T -->|"cek status"| P
    A["Admin: /sekolah/ppdb"] -->|"review"| DB
```

## Modul

- Absensi guru dan siswa, data siswa, kelas, tahun ajaran, riwayat kenaikan kelas
- Nilai dan rapor dengan skema penilaian yang bisa diatur
- Program mengaji (Iqro, Quran, Tahsin)
- SPP, keuangan yayasan, gaji dan slip gaji, pajak yayasan
- Perpustakaan: koleksi, peminjaman, denda
- Jadwal pelajaran dan agenda ujian
- PPDB online dan kartu pelajar
- Laporan lintas sekolah

## Keputusan teknis

**Next.js dan Supabase, bukan Laravel dengan VPS.** Repositori referensi memakai Laravel, MySQL, Redis, dan MinIO, yang butuh server menyala terus dengan biaya bulanan dan perawatan sendiri (patch keamanan, backup, uptime). Dengan Vercel dan Supabase, hosting gratis dan tidak ada server yang dijaga. Fondasi yang sudah ada, termasuk fitur khusus seperti input dari foto, tidak perlu ditulis ulang. Repositori Laravel tetap dipakai sebagai daftar acuan modul, lalu diterjemahkan ke stack ini. Pindah ke VPS tetap mungkin saat sudah produksi penuh.

**Orang tua tanpa akun.** Akses lewat tautan bertoken. Tidak ada kata sandi untuk dikelola atau dilupakan, dan setiap tautan hanya membuka satu anak.

**Migrasi database terversi.** Skema berubah lewat berkas migrasi bernomor, bukan perubahan manual.

## Stack

Next.js 16, React 19, TypeScript, Supabase (Postgres, Auth, Storage), Tailwind CSS 4, Zod, Gemini API, face-api.js

## Status

Modul utama berjalan di database produksi. Antarmuka sedang disusun ulang bertahap berdasarkan panduan desain per peran: token desain, ikon konsisten, navigasi bawah untuk mobile, dan sidebar untuk desktop.
