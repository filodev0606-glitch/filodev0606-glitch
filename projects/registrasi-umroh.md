# Registrasi Jamaah Umroh

Sistem pendaftaran jamaah online untuk sebuah biro perjalanan umroh.

## Konteks

Pendaftaran tersebar di beberapa cabang dan dicatat manual, sehingga pusat sulit melihat jumlah pendaftar dan kinerja tiap cabang.

## Arsitektur

```mermaid
flowchart LR
    J["Calon jamaah"] --> FE["React + Vite (Firebase Hosting)"]
    AC["Admin cabang"] --> FE
    PU["Pemilik pusat"] --> FE
    FE --> FS[("Firestore")]
    FE --> ST[("Storage: bukti bayar")]
    RU["Aturan Firestore dan Storage"] -.->|"membatasi akses per cabang"| FS
    RU -.-> ST
```

## Cara kerja

### 1. Alur pendaftaran

```mermaid
flowchart LR
    A["Langkah 1: data diri"] --> B["Langkah 2: pilih paket dan cabang"]
    B --> C["Langkah 3: unggah bukti bayar"]
    C --> D["Nomor referensi"]
    D --> E[("Firestore")]
    E --> F["Dashboard cabang: ubah status"]
    F --> G["Dashboard pusat: rekap semua cabang"]
```

### 2. Hak akses

```mermaid
flowchart TD
    P["Pemilik pusat"] -->|"semua cabang"| ALL["Peringkat cabang, kelola cabang dan paket, templat pesan"]
    AC["Admin cabang"] -->|"hanya cabangnya"| ONE["Data jamaah, ubah status, grafik, ekspor Excel dan PDF"]
    PB["Calon jamaah"] -->|"tanpa login"| FORM["Hanya formulir pendaftaran"]
```

### 3. Dua mode yang berpindah otomatis

```mermaid
flowchart LR
    subgraph M1["Mode mandiri (paket gratis, sekarang)"]
        A1["Pendaftaran, dashboard, ekspor, grafik"]
        A2["Admin kirim WhatsApp lewat tombol, teks terisi otomatis"]
    end
    subgraph M2["Mode server (paket berbayar + Cloud Functions)"]
        B1["WhatsApp, email, pengingat terjadwal berjalan sendiri"]
    end
    M1 -->|"project dinaikkan dan fungsi dipasang"| M2
```

## Struktur

```
frontend/           React, Vite, Tailwind
  src/pages/        halaman
  src/components/   komponen ulang
  src/services/     database, ekspor, WhatsApp
  src/hooks/        logika bersama
backend/functions/  Cloud Functions (jamaah, WhatsApp, email, auth)
firestore.rules     aturan baca dan tulis
storage.rules       aturan berkas bukti bayar
docs/               panduan admin, pemasangan, keamanan, status
```

## Keputusan teknis

**Dua mode yang berpindah otomatis.** Kode untuk mode server sudah ada, jadi klien tidak perlu pengerjaan ulang saat naik paket.

**Pembatasan per cabang di aturan database.** Admin cabang hanya bisa membaca dan mengubah data cabangnya, ditegakkan oleh aturan Firestore dan bukan hanya antarmuka.

**Dokumentasi untuk non-teknis.** Panduan admin ditulis dengan bahasa sederhana untuk pemakaian harian.

## Stack

React, Vite, Tailwind CSS, Firebase (Firestore, Storage, Hosting, Cloud Functions)

## Cuplikan kode

[code/registrasi-umroh](../code/registrasi-umroh)
