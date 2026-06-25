-- ===========================================================================
-- fix-13 — Sièges PERSONNELS : 1 clé = 1 siège, rattaché à l'UTILISATEUR.
-- Idempotent. À exécuter après fix-12.
--
--   - Chaque personne consomme SA propre clé d'accès → son siège.
--   - Un membre d'entreprise ne peut être actif que s'il a un siège (clé,
--     ou entreprise legacy `is_comp`).
--   - Créer une entreprise : nom requis, REFUSÉ si le nom existe déjà.
--   - Rejoindre : via la clé entreprise (join_code).
-- ===========================================================================

-- La clé est désormais consommée par un UTILISATEUR (et non une entreprise).
alter table public.access_keys
  add column if not exists redeemed_by_user uuid references public.profiles (id) on delete set null;

-- L'utilisateur a-t-il un siège ? (clé consommée, ou entreprise legacy offerte)
create or replace function public.user_has_seat(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.access_keys where redeemed_by_user = p_user)
      or exists (
        select 1 from public.company_members m
        join public.companies c on c.id = m.company_id
        where m.user_id = p_user and m.status = 'active' and c.is_comp
      );
$$;

-- Exposé au front pour le compte courant.
create or replace function public.has_seat()
returns boolean language sql security definer stable set search_path = public as $$
  select public.user_has_seat(auth.uid());
$$;

-- Un membre ne peut devenir actif que s'il a un siège.
create or replace function public.enforce_seat_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and not public.user_has_seat(new.user_id) then
    raise exception 'seat_required';
  end if;
  return new;
end;
$$;

-- Redeem : consomme UNE clé pour le compte courant (1 clé = 1 siège). Idempotent.
-- search_path inclut `extensions` car digest() (pgcrypto) y vit chez Supabase.
create or replace function public.redeem_access_key(p_code text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_key uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.user_has_seat(auth.uid()) then return true; end if; -- déjà un siège
  select id into v_key from public.access_keys
   where code_hash = encode(digest(p_code, 'sha256'), 'hex') and redeemed_by_user is null
   for update;
  if v_key is null then raise exception 'invalid_or_used_key'; end if;
  update public.access_keys set redeemed_by_user = auth.uid(), redeemed_at = now() where id = v_key;
  return true;
end;
$$;

-- Créer une entreprise : nom requis, refusé si déjà pris ; le créateur doit avoir un siège.
create or replace function public.create_company(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_name text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.user_has_seat(auth.uid()) then raise exception 'seat_required'; end if;
  v_name := trim(coalesce(p_name, ''));
  if v_name = '' then raise exception 'name_required'; end if;
  if exists (select 1 from public.companies where lower(name) = lower(v_name)) then
    raise exception 'company_name_taken';
  end if;
  insert into public.companies (name, status) values (v_name, 'active') returning id into v_company;
  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), 'owner', 'active');
  return v_company;
end;
$$;

-- Rejoindre une entreprise via sa clé : le user doit avoir un siège.
create or replace function public.join_company_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.user_has_seat(auth.uid()) then raise exception 'seat_required'; end if;
  select id into v_company from public.companies where upper(join_code) = upper(trim(p_code));
  if v_company is null then raise exception 'company_not_found'; end if;
  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), 'member', 'active')
    on conflict (company_id, user_id) do update set status = 'active';
  return v_company;
end;
$$;

notify pgrst, 'reload schema';
