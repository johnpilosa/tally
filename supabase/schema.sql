-- Retro Log / Tally: lo que se guarda en la nube por cada cuenta.
-- Pégalo entero en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.

-- Una fila por cada cosa guardada de cada persona (juegos, perfil, contadores, íconos).
create table if not exists public.user_data (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Cada persona solo puede ver y cambiar sus propias filas.
alter table public.user_data enable row level security;

drop policy if exists "Own data: read" on public.user_data;
create policy "Own data: read" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Own data: insert" on public.user_data;
create policy "Own data: insert" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Own data: update" on public.user_data;
create policy "Own data: update" on public.user_data
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Own data: delete" on public.user_data;
create policy "Own data: delete" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_data to authenticated;

-- Fotos de perfil: cualquiera puede verlas; cada persona solo sube a su propia carpeta.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatars: upload own" on storage.objects;
create policy "Avatars: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatars: replace own" on storage.objects;
create policy "Avatars: replace own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatars: delete own" on storage.objects;
create policy "Avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
