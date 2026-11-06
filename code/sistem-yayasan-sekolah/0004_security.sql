-- =========================================================================
-- Rate limiting percobaan login (anti brute-force), diakses via RPC
-- karena request login terjadi sebelum user punya sesi (anon).
-- =========================================================================

create table login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

create index idx_login_attempts_username_time on login_attempts(username, attempted_at desc);

alter table login_attempts enable row level security;
-- Tidak ada policy select/insert langsung -- akses cuma lewat fungsi SECURITY DEFINER di bawah.

create or replace function login_attempts_check(p_username text)
returns boolean
language sql stable security definer set search_path = public as $$
  select count(*) < 5
  from login_attempts
  where username = lower(trim(p_username))
    and success = false
    and attempted_at > now() - interval '15 minutes';
$$;

create or replace function login_attempts_record(p_username text, p_success boolean)
returns void
language sql security definer set search_path = public as $$
  insert into login_attempts (username, success)
  values (lower(trim(p_username)), p_success);
$$;

-- Bersihkan log lama otomatis tiap kali ada insert baru (housekeeping ringan)
create or replace function login_attempts_cleanup()
returns trigger
language plpgsql as $$
begin
  delete from login_attempts where attempted_at < now() - interval '1 day';
  return new;
end;
$$;

create trigger trg_login_attempts_cleanup
  after insert on login_attempts
  execute function login_attempts_cleanup();

grant execute on function login_attempts_check(text) to anon, authenticated;
grant execute on function login_attempts_record(text, boolean) to anon, authenticated;
