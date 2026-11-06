# Filodev Control Center

Satu panel admin untuk mengendalikan beberapa produk Filodev dan mencatat tagihan semua klien.

## Konteks

Tiap produk punya admin sendiri. Mengurus status langganan, jeda akun, pengumuman, dan tagihan dari beberapa tempat lambat dan mudah salah.

## Arsitektur

```mermaid
flowchart LR
    U["Admin (peramban)"] -->|"cookie sesi"| W["Worker /api/*"]
    W --> D[("D1: sesi, audit, tagihan")]
    W -->|"server ke server, rute daftar putih"| P["API produk"]
    W -->|"satu dokumen, field daftar putih"| F[("Firestore produk")]
```

Worker hanya menangani `/api/*`. Halaman statis dilayani terpisah.

## Cara kerja

### 1. Login dan sesi

```mermaid
sequenceDiagram
    participant A as Admin
    participant G as Google Identity
    participant W as Worker
    participant D as D1
    A->>G: Masuk dengan Google
    G-->>A: ID token
    A->>W: POST /api/masuk
    Note over W: Verifikasi RS256, audiens, email terverifikasi dan cocok admin
    W->>D: Simpan hash sesi (12 jam)
    W-->>A: Cookie HttpOnly, Secure, SameSite=Strict
```

### 2. Setiap aksi yang mengubah data

```mermaid
flowchart LR
    R["POST dari peramban"] --> C{"Header khusus dan Origin sama?"}
    C -->|"tidak"| X["Ditolak (CSRF)"]
    C -->|"ya"| S{"Sesi valid?"}
    S -->|"tidak"| X2["Ditolak"]
    S -->|"ya"| H["Jalankan aksi"]
    H --> L["Catat audit: nama kolom, bukan isi"]
```

### 3. Pembayaran dan koreksi

```mermaid
stateDiagram-v2
    [*] --> tercatat: Catat pembayaran
    tercatat --> batal: Void (alasan wajib)
    batal --> [*]
    tercatat --> [*]
```

Pembayaran yang dibatalkan tetap ada di riwayat dan tidak ikut total.

## Keputusan teknis

**Tanpa dependensi runtime.** Worker ditulis dengan JavaScript biasa. Permukaan serangan kecil dan tidak ada paket yang perlu dipantau kerentanannya.

**Token layanan tidak pernah ke peramban.** Permintaan ke produk lain diteruskan dari server dengan token di sisi server, hanya ke rute pada daftar putih.

**Akses ke Firestore dibatasi sempit.** Worker memakai service account dengan peran minimal, hanya menyentuh satu dokumen status dan field pada daftar putih. Data penjualan tidak pernah dibaca. Akses dicabut dengan menghapus kunci.

**Pembayaran tidak dihapus.** Riwayat keuangan tetap utuh.

**Audit mencatat nama kolom, bukan isi.** Jejak perubahan tersedia tanpa menyimpan data sensitif dua kali.

## Fitur

Kontrol akun per produk (jeda, jalankan, jadwal lunas, pengumuman), buku tagihan lintas klien dengan status jatuh tempo, pengingat WhatsApp, kwitansi cetak bernomor, dan ekspor CSV.

## Stack

Cloudflare Workers, D1, Google Identity Services

## Pengujian

53 tes otomatis: login, sesi, CSRF, proxy daftar putih, audit, buku tagihan, logika tanggal, format kwitansi. Mode lokal dengan data palsu untuk uji manual.

## Cuplikan kode

[code/filodev-control-center](../code/filodev-control-center)
