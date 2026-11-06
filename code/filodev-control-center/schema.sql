-- Hub kontrol Filodev. Status jeda/langganan tiap app tetap tinggal di backend app itu sendiri;
-- di sini hanya sesi login, jejak audit, dan buku tagihan manual.

CREATE TABLE IF NOT EXISTS sesi (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sesi_exp ON sesi (expires_at);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  email TEXT NOT NULL,
  app TEXT NOT NULL,
  aksi TEXT NOT NULL,
  target TEXT,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit (at DESC);

-- Klien berbayar yang ditagih (Palmera, tenant AI Kasir yang bayar manual).
CREATE TABLE IF NOT EXISTS klien (
  id TEXT PRIMARY KEY,
  app TEXT NOT NULL,
  nama TEXT NOT NULL,
  kontak_wa TEXT,
  harga_per_bulan INTEGER NOT NULL DEFAULT 0,
  lunas_sampai INTEGER,
  grace_days INTEGER NOT NULL DEFAULT 3,
  catatan TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pembayaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  klien_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  jumlah INTEGER NOT NULL,
  bulan INTEGER NOT NULL,
  metode TEXT,
  catatan TEXT,
  -- Pembayaran tidak pernah dihapus: salah catat dibatalkan (batal_at diisi) dan tidak ikut total.
  batal_at INTEGER,
  batal_alasan TEXT
);
CREATE INDEX IF NOT EXISTS idx_bayar_klien ON pembayaran (klien_id, at DESC);
