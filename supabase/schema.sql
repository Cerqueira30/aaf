create table config(id int primary key default 1 check (id=1), open boolean not null default false, closes_at timestamptz);
insert into config default values;
create table photos(id uuid primary key default gen_random_uuid(), number int unique not null, path text not null, active boolean not null default true, created_at timestamptz default now());
create table participations(voter text primary key, created_at timestamptz default now());
create table votes(voter text references participations(voter), photo_id uuid references photos(id), primary key(voter, photo_id));
create table admins(user_id uuid primary key references auth.users(id));

create function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from admins where user_id = auth.uid()) $$;

alter table config enable row level security; alter table photos enable row level security;
alter table participations enable row level security; alter table votes enable row level security; alter table admins enable row level security;
create policy cfg_read on config for select using (true);
create policy cfg_upd on config for update using (is_admin());
create policy ph_read on photos for select using (active or is_admin());
create policy ph_ins on photos for insert with check (is_admin());
create policy ph_upd on photos for update using (is_admin());
create policy ph_del on photos for delete using (is_admin());
-- participations, votes, admins: sem políticas = ninguém lê/escreve diretamente.

-- Registo atómico: ou fica tudo gravado, ou nada. A chave primária impede votos duplicados.
create function cast_vote(p_voter text, p_choices uuid[]) returns void language plpgsql security definer set search_path=public as $$
declare c config%rowtype; n int;
begin
  select * into c from config where id=1;
  if not c.open or (c.closes_at is not null and c.closes_at < now()) then raise exception 'closed'; end if;
  n := coalesce(cardinality(p_choices),0);
  if n < 1 or n > 3 or n <> (select count(distinct x) from unnest(p_choices) x) then raise exception 'invalid_choices'; end if;
  if (select count(*) from photos where id = any(p_choices) and active) <> n then raise exception 'invalid_photo'; end if;
  insert into participations(voter) values (p_voter);
  insert into votes(voter, photo_id) select p_voter, unnest(p_choices);
end $$;
revoke all on function cast_vote(text, uuid[]) from public, anon, authenticated;

create function results() returns table(photo_id uuid, number int, path text, active boolean, votes bigint)
language sql stable security definer set search_path=public as
$$ select p.id, p.number, p.path, p.active, count(v.voter) from photos p left join votes v on v.photo_id=p.id
   where is_admin() group by p.id order by 5 desc, p.number $$;
create function totals() returns json language sql stable security definer set search_path=public as
$$ select case when is_admin() then json_build_object('participations',(select count(*) from participations),'votes',(select count(*) from votes)) end $$;

insert into storage.buckets(id,name,public) values ('photos','photos',true) on conflict do nothing;
create policy st_ins on storage.objects for insert with check (bucket_id='photos' and is_admin());
create policy st_del on storage.objects for delete using (bucket_id='photos' and is_admin());
