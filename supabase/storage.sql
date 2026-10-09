-- Execute in the SQL editor of a dedicated Supabase FREE project.
-- Firebase integration: project ID fotosconailu. Only admin-issued members are accepted.
create or replace function public.rincon_member() returns boolean
language sql stable set search_path = '' as $$
 select coalesce(auth.jwt()->>'iss' = 'https://securetoken.google.com/fotosconailu'
 and auth.jwt()->>'aud' = 'fotosconailu' and auth.jwt()->>'rincon' = 'true'
 and auth.jwt()->>'role' = 'authenticated', false)
$$;
create table if not exists public.rincon_reservations (
 id uuid primary key,
 original_bytes bigint not null check (original_bytes between 1 and 50000000),
 thumbnail_bytes bigint not null check (thumbnail_bytes between 0 and 5000000),
 ext text not null check (ext in ('jpg','png','gif','webp','avif','mp4','webm','mp3','wav','ogg','m4a')),
 mime text not null,
 created_at timestamptz not null default now()
);
alter table public.rincon_reservations enable row level security;
revoke all on public.rincon_reservations from anon, authenticated;
grant select on public.rincon_reservations to authenticated;
drop policy if exists rincon_reservations_read on public.rincon_reservations;
create policy rincon_reservations_read on public.rincon_reservations for select to authenticated using (public.rincon_member());

create or replace function public.rincon_reserve(asset_id uuid, original_bytes bigint, thumbnail_bytes bigint, extension text, content_mime text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.rincon_member() then raise exception 'Access denied'; end if;
 if content_mime is distinct from (case extension
 when 'jpg' then 'image/jpeg' when 'png' then 'image/png' when 'gif' then 'image/gif'
 when 'webp' then 'image/webp' when 'avif' then 'image/avif' when 'mp4' then 'video/mp4'
 when 'webm' then 'video/webm' when 'mp3' then 'audio/mpeg' when 'wav' then 'audio/wav'
 when 'ogg' then 'audio/ogg' when 'm4a' then 'audio/mp4' else '' end)
 then raise exception 'Invalid format'; end if;
 if (extension in ('jpg','png','gif','webp','avif')) != (thumbnail_bytes > 0)
 then raise exception 'Invalid thumbnail'; end if;
 perform pg_advisory_xact_lock(779560436915);
 if (select coalesce(sum(r.original_bytes + r.thumbnail_bytes),0) from public.rincon_reservations r)
    + original_bytes + thumbnail_bytes > 900000000 then raise exception 'Storage quota exceeded'; end if;
 insert into public.rincon_reservations(id,original_bytes,thumbnail_bytes,ext,mime)
 values(asset_id,original_bytes,thumbnail_bytes,extension,content_mime);
end $$;

create or replace function public.rincon_release(asset_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.rincon_member() then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(779560436915);
 perform 1 from public.rincon_reservations where id=asset_id for update;
 if exists(select 1 from storage.objects o where o.bucket_id='rincon' and (storage.foldername(o.name))[1]=asset_id::text)
 then raise exception 'Remove objects before releasing quota'; end if;
 delete from public.rincon_reservations where id=asset_id;
end $$;
create or replace function public.rincon_used() returns bigint
language plpgsql security definer set search_path = '' as $$
begin
 if not public.rincon_member() then raise exception 'Access denied'; end if;
 return (select coalesce(sum(original_bytes + thumbnail_bytes),0)::bigint from public.rincon_reservations);
end $$;
revoke all on function public.rincon_reserve(uuid,bigint,bigint,text,text), public.rincon_release(uuid), public.rincon_used() from public, anon;
grant execute on function public.rincon_reserve(uuid,bigint,bigint,text,text), public.rincon_release(uuid), public.rincon_used(), public.rincon_member() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('rincon','rincon',false,50000000,array['image/jpeg','image/png','image/gif','image/webp','image/avif','video/mp4','video/webm','audio/mpeg','audio/wav','audio/ogg','audio/mp4'])
on conflict(id) do update set public=false, file_size_limit=50000000, allowed_mime_types=excluded.allowed_mime_types;

-- Storage first performs a rolled-back permission probe with incomplete metadata,
-- then completes the object as its internal superuser. Enforce actual size in a
-- trigger as well as RLS so the final privileged INSERT cannot bypass reservations.
create or replace function public.rincon_validate_object() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.rincon_reservations; size_bytes bigint;
begin
 if new.bucket_id != 'rincon' then return new; end if;
 select * into r from public.rincon_reservations where id::text=split_part(new.name,'/',1) for key share;
 if not found then raise exception 'Missing storage reservation'; end if;
 if new.name not in (r.id::text || '/original.' || r.ext, r.id::text || '/thumb.webp')
 then raise exception 'Invalid object path'; end if;
 -- The permission probe has no actual size; it is rolled back by Storage.
 if new.metadata->>'size' is null then return new; end if;
 size_bytes := (new.metadata->>'size')::bigint;
 if new.name = r.id::text || '/original.' || r.ext then
  if size_bytes < 1 or size_bytes > r.original_bytes or new.metadata->>'mimetype' is distinct from r.mime
  then raise exception 'Object exceeds reservation or format'; end if;
 else
  if size_bytes < 1 or size_bytes > r.thumbnail_bytes or new.metadata->>'mimetype' is distinct from 'image/webp'
  then raise exception 'Thumbnail exceeds reservation or format'; end if;
 end if;
 return new;
end $$;
revoke all on function public.rincon_validate_object() from public,anon,authenticated;
drop trigger if exists rincon_object_reservation on storage.objects;
create trigger rincon_object_reservation before insert or update on storage.objects
for each row execute function public.rincon_validate_object();

drop policy if exists rincon_files_read on storage.objects;
drop policy if exists rincon_files_insert on storage.objects;
drop policy if exists rincon_files_delete on storage.objects;
create policy rincon_files_read on storage.objects for select to authenticated
using(bucket_id='rincon' and public.rincon_member());
create policy rincon_files_delete on storage.objects for delete to authenticated
using(bucket_id='rincon' and public.rincon_member());
create policy rincon_files_insert on storage.objects for insert to authenticated
with check(bucket_id='rincon' and public.rincon_member() and exists (
 select 1 from public.rincon_reservations r where
 name = r.id::text || '/original.' || r.ext
 and (metadata->>'size' is null or ((metadata->>'size')::bigint between 1 and r.original_bytes and metadata->>'mimetype' = r.mime))
 or name = r.id::text || '/thumb.webp'
 and r.thumbnail_bytes > 0
 and (metadata->>'size' is null or ((metadata->>'size')::bigint between 1 and r.thumbnail_bytes and metadata->>'mimetype' = 'image/webp'))
));
-- No UPDATE policy: objects cannot be replaced or enlarged in place.
