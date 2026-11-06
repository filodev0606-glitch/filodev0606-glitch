# Platform Kelas Online

Web kelas online dan e-book untuk seorang pengajar bahasa Arab dan Al-Qur'an. Peserta belajar lewat HP, ikut kelas live, mengerjakan kuis, dan mendapat sertifikat yang bisa diverifikasi publik.

## Konteks

Pengajar sebelumnya menjual kelas lewat chat dan transfer manual. Ia butuh satu tempat untuk katalog, pembayaran, materi, kelas live, dan sertifikat, yang nyaman dipakai di HP dan tidak butuh server yang dijaga.

## Arsitektur

```mermaid
flowchart LR
    U["Peserta (HP, PWA)"] --> W["Astro SSR di Cloudflare Workers"]
    A["Admin (pengajar)"] --> W
    W --> D[("D1 + Drizzle")]
    W --> R[("R2 privat")]
    W --> L["Live class (WebRTC)"]
    B["Penyedia mutasi bank"] -->|"webhook + HMAC"| W
    W --> E["Email dan Telegram"]
```

## Cara kerja

### 1. Pembayaran transfer dengan kode unik

Tidak membuat gateway sendiri. Pesanan mendapat total dengan kode unik 3 digit, lalu webhook dari pembaca mutasi bank mencocokkan nominalnya.

```mermaid
sequenceDiagram
    participant P as Peserta
    participant S as Server
    participant M as Penyedia mutasi
    participant A as Admin
    P->>S: Pesan kelas
    S-->>P: Total + kode unik, berlaku 24 jam
    P->>P: Transfer sesuai nominal
    M->>S: Webhook mutasi masuk (HMAC)
    S->>S: Verifikasi tanda tangan dan cocokkan nominal
    alt Nominal cocok
        S->>S: Pesanan terverifikasi, akses dibuka
    else Tidak cocok
        S->>A: Masuk antrean cek manual (dicatat di log)
    end
```

### 2. Dari selesai belajar sampai sertifikat

```mermaid
stateDiagram-v2
    [*] --> belajar
    belajar --> menunggu: Semua pelajaran selesai
    menunggu --> lulus: Pengajar menyatakan lulus
    menunggu --> tidak_lulus: Pengajar menolak
    lulus --> sertifikat: Peserta mengisi nama asli
    sertifikat --> [*]: PDF dengan nomor unik dan QR verifikasi
```

## Keputusan teknis

**Pembayaran lewat lapisan `PaymentProvider`.** Webhook dinormalkan ke satu bentuk (`ref`, `nominal`), sehingga penyedia mutasi bisa diganti tanpa menyentuh logika pesanan. Tanda tangan HMAC diperiksa dengan perbandingan waktu konstan.

**Sandi dengan PBKDF2 di WebCrypto.** Workers membatasi iterasi, jadi versi iterasi ikut disimpan di hash dan bisa dinaikkan lewat hash ulang setelah login. Respons untuk surel yang tidak terdaftar memakai hash palsu agar waktunya sama. Sandi diperiksa juga terhadap daftar bocor dengan k-anonymity.

**CSP tanpa skrip inline.** Skrip hanya dari berkas sendiri, jadi XSS yang menyisipkan `<script>` tidak jalan. Pemeriksaan di skrip build menggagalkan build bila ada skrip inline.

**Rate limit di tepi, gagal-terbuka.** Kunci memakai pengguna bila sudah login supaya jaringan bersama tidak saling mengunci. Bila layanan pembatas bermasalah, situs tetap melayani.

**Tiga bahasa.** Indonesia, Inggris, dan Arab (kanan-ke-kiri) dari satu set kamus yang diperiksa di build.

**Sertifikat bisa diverifikasi.** Nomor unik dan QR menuju halaman verifikasi publik. Nama di sertifikat hanya bisa dikoreksi lewat admin, dan tercatat di log.

## Cakupan

Katalog kelas dan e-book, kupon dan bundel, pelajaran yang terbuka sesuai jadwal, kuis, kelas live dengan ruang tunggu, komentar dan ulasan, notifikasi, sertifikat, panel admin lengkap dengan log audit, PWA, dan asisten untuk pengajar.

## Stack

Astro (SSR), Cloudflare Workers, D1, Drizzle ORM, R2, WebRTC, Turnstile, Google OAuth, Vitest

## Cuplikan kode

[code/platform-kelas-online](../code/platform-kelas-online)
