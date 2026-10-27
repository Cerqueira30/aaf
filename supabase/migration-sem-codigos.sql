-- Votação livre (sem códigos): cada submissão é uma votação nova. Corre no SQL Editor do Supabase.
drop table if exists vote_codes;
create table vote_rate(ip_hash text not null, at timestamptz not null default now());
create index on vote_rate(ip_hash, at);
alter table vote_rate enable row level security; -- sem políticas: só o servidor acede

drop function if exists cast_vote(text, uuid[]);
create function cast_vote(p_voter text, p_choices uuid[], p_ip text) returns void language plpgsql security definer set search_path=public as $$
declare c config%rowtype; n int;
begin
  select * into c from config where id=1;
  if not c.open or (c.closes_at is not null and c.closes_at < now()) then raise exception 'closed'; end if;
  n := coalesce(cardinality(p_choices),0);
  if n < 1 or n > 3 or n <> (select count(distinct x) from unnest(p_choices) x) then raise exception 'invalid_choices'; end if;
  if (select count(*) from photos where id = any(p_choices) and active) <> n then raise exception 'invalid_photo'; end if;
  delete from vote_rate where at < now() - interval '1 hour';
  if (select count(*) from vote_rate where ip_hash = p_ip) >= 30 then raise exception 'rate_limited'; end if;
  insert into vote_rate(ip_hash) values (p_ip);
  insert into participations(voter) values (p_voter);
  insert into votes(voter, photo_id) select p_voter, unnest(p_choices);
end $$;
revoke all on function cast_vote(text, uuid[], text) from public, anon, authenticated;

create or replace function totals() returns json language sql stable security definer set search_path=public as
$$ select case when is_admin() then json_build_object('participations',(select count(*) from participations),'votes',(select count(*) from votes)) end $$;
