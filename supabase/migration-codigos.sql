create table vote_codes(code_hash text primary key, created_at timestamptz default now(), used_at timestamptz);
alter table vote_codes enable row level security; -- sem políticas: só o servidor acede

create or replace function cast_vote(p_voter text, p_choices uuid[]) returns void language plpgsql security definer set search_path=public as $$
declare c config%rowtype; n int; u int;
begin
  select * into c from config where id=1;
  if not c.open or (c.closes_at is not null and c.closes_at < now()) then raise exception 'closed'; end if;
  n := coalesce(cardinality(p_choices),0);
  if n < 1 or n > 3 or n <> (select count(distinct x) from unnest(p_choices) x) then raise exception 'invalid_choices'; end if;
  if (select count(*) from photos where id = any(p_choices) and active) <> n then raise exception 'invalid_photo'; end if;
  update vote_codes set used_at = now() where code_hash = p_voter and used_at is null;
  get diagnostics u = row_count;
  if u = 0 then raise exception 'invalid_code'; end if;  -- código inexistente ou já usado
  insert into participations(voter) values (p_voter);
  insert into votes(voter, photo_id) select p_voter, unnest(p_choices);
end $$;
revoke all on function cast_vote(text, uuid[]) from public, anon, authenticated;

create or replace function totals() returns json language sql stable security definer set search_path=public as
$$ select case when is_admin() then json_build_object('participations',(select count(*) from participations),'votes',(select count(*) from votes),
  'codes',(select count(*) from vote_codes),'codes_used',(select count(*) from vote_codes where used_at is not null)) end $$;
