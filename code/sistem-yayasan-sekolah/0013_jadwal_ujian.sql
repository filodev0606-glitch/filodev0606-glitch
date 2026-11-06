-- =========================================================================
-- Modul Jadwal Pelajaran & Ujian: jadwal mingguan per kelas dan agenda ujian
-- =========================================================================

create type hari_pekan as enum ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu');

create table jadwal_pelajaran (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  mata_pelajaran_id uuid not null references mata_pelajaran(id) on delete cascade,
  guru_id uuid references app_users(id) on delete set null,
  hari hari_pekan not null,
  jam_mulai time not null,
  jam_selesai time not null,
  created_at timestamptz not null default now(),
  constraint jadwal_pelajaran_jam_valid check (jam_selesai > jam_mulai)
);

create index idx_jadwal_pelajaran_kelas on jadwal_pelajaran(kelas_id);
create index idx_jadwal_pelajaran_guru on jadwal_pelajaran(guru_id);

create type jenis_ujian as enum ('harian', 'uts', 'uas', 'lainnya');

create table ujian (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  tahun_ajaran_id uuid not null references tahun_ajaran(id) on delete cascade,
  nama text not null,
  jenis jenis_ujian not null default 'lainnya',
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  created_at timestamptz not null default now(),
  constraint ujian_tanggal_valid check (tanggal_selesai >= tanggal_mulai)
);

create index idx_ujian_sekolah on ujian(sekolah_id);

create table jadwal_ujian_mapel (
  id uuid primary key default gen_random_uuid(),
  ujian_id uuid not null references ujian(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  mata_pelajaran_id uuid not null references mata_pelajaran(id) on delete cascade,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  ruangan text,
  created_at timestamptz not null default now(),
  constraint jadwal_ujian_mapel_jam_valid check (jam_selesai > jam_mulai)
);

create index idx_jadwal_ujian_mapel_ujian on jadwal_ujian_mapel(ujian_id);
create index idx_jadwal_ujian_mapel_kelas on jadwal_ujian_mapel(kelas_id);

-- -------------------------------------------------------------------------
-- RLS: kepsek/yayasan kelola, guru lihat jadwal & ujian sekolahnya
-- -------------------------------------------------------------------------
alter table jadwal_pelajaran enable row level security;
alter table ujian enable row level security;
alter table jadwal_ujian_mapel enable row level security;

create policy "jadwal_pelajaran_select" on jadwal_pelajaran
  for select using (
    current_app_role() in ('yayasan', 'staff_yayasan')
    or sekolah_id = current_sekolah_id()
  );
create policy "jadwal_pelajaran_write" on jadwal_pelajaran
  for all using (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  ) with check (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  );

create policy "ujian_select" on ujian
  for select using (
    current_app_role() in ('yayasan', 'staff_yayasan')
    or sekolah_id = current_sekolah_id()
  );
create policy "ujian_write" on ujian
  for all using (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  ) with check (
    current_app_role() = 'yayasan'
    or (current_app_role() = 'kepala_sekolah' and sekolah_id = current_sekolah_id())
  );

create policy "jadwal_ujian_mapel_select" on jadwal_ujian_mapel
  for select using (
    exists (
      select 1 from ujian u
      where u.id = ujian_id
        and (current_app_role() in ('yayasan', 'staff_yayasan') or u.sekolah_id = current_sekolah_id())
    )
  );
create policy "jadwal_ujian_mapel_write" on jadwal_ujian_mapel
  for all using (
    current_app_role() = 'yayasan'
    or exists (
      select 1 from ujian u
      where u.id = ujian_id and u.sekolah_id = current_sekolah_id() and current_app_role() = 'kepala_sekolah'
    )
  ) with check (
    current_app_role() = 'yayasan'
    or exists (
      select 1 from ujian u
      where u.id = ujian_id and u.sekolah_id = current_sekolah_id() and current_app_role() = 'kepala_sekolah'
    )
  );

grant select, insert, update, delete on jadwal_pelajaran to anon, authenticated, service_role;
grant select, insert, update, delete on ujian to anon, authenticated, service_role;
grant select, insert, update, delete on jadwal_ujian_mapel to anon, authenticated, service_role;
