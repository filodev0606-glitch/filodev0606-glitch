-- =========================================================================
-- Modul Perpustakaan: koleksi buku & sirkulasi peminjaman per sekolah
-- =========================================================================

create table buku (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  judul text not null,
  penulis text,
  penerbit text,
  tahun_terbit integer,
  isbn text,
  kategori text,
  stok integer not null default 1,
  created_at timestamptz not null default now()
);

create index idx_buku_sekolah on buku(sekolah_id);

create type status_peminjaman as enum ('dipinjam', 'dikembalikan');

create table peminjaman_buku (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  buku_id uuid not null references buku(id) on delete cascade,
  siswa_id uuid not null references siswa(id) on delete cascade,
  tanggal_pinjam date not null default current_date,
  tanggal_jatuh_tempo date not null,
  tanggal_kembali date,
  denda numeric not null default 0,
  status status_peminjaman not null default 'dipinjam',
  dicatat_oleh uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_peminjaman_sekolah on peminjaman_buku(sekolah_id);
create index idx_peminjaman_buku on peminjaman_buku(buku_id);
create index idx_peminjaman_siswa on peminjaman_buku(siswa_id);

-- -------------------------------------------------------------------------
-- RLS: kepsek kelola koleksi & sirkulasi sekolahnya, guru & yayasan lihat saja
-- -------------------------------------------------------------------------
alter table buku enable row level security;
alter table peminjaman_buku enable row level security;

create policy "buku_select" on buku
  for select using (
    current_app_role() in ('yayasan', 'staff_yayasan')
    or sekolah_id = current_sekolah_id()
  );
create policy "buku_write" on buku
  for all using (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  ) with check (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  );

create policy "peminjaman_buku_select" on peminjaman_buku
  for select using (
    current_app_role() in ('yayasan', 'staff_yayasan')
    or sekolah_id = current_sekolah_id()
  );
create policy "peminjaman_buku_write" on peminjaman_buku
  for all using (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  ) with check (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  );

grant select, insert, update, delete on buku to anon, authenticated, service_role;
grant select, insert, update, delete on peminjaman_buku to anon, authenticated, service_role;
