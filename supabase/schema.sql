-- Esquema de Supabase para sincronizar el cartón entre móviles.
-- Ya está aplicado en el proyecto; este archivo es la referencia.

-- Un cartón compartido por fila. Nadie accede a la tabla directamente:
-- RLS activado y sin políticas. Todo pasa por la función sync_card().
create table public.cards (
  code_hash  text primary key,                   -- sha256 del código del cartón
  cells      jsonb not null default '{}'::jsonb, -- { [id]: { done, at } }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cards enable row level security;
revoke all on table public.cards from anon, authenticated;

-- Fusiona las casillas que envía un móvil con las guardadas (en cada casilla
-- gana el cambio más reciente) y devuelve el resultado.
create function public.sync_card(p_code text, p_cells jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash   text;
  v_stored jsonb;
  v_merged jsonb;
  v_now_ms numeric := floor(extract(epoch from now()) * 1000);
begin
  if p_code is null or p_code !~ '^[A-Za-z0-9_-]{20,64}$' then
    raise exception 'invalid code';
  end if;
  if p_cells is null or jsonb_typeof(p_cells) <> 'object' then
    p_cells := '{}'::jsonb;
  end if;
  if length(p_cells::text) > 20000 then
    raise exception 'payload too large';
  end if;

  v_hash := encode(sha256(convert_to(p_code, 'UTF8')), 'hex');

  if not exists (select 1 from public.cards where code_hash = v_hash) then
    if (select count(*) from public.cards) >= 500 then
      raise exception 'too many cards';
    end if;
    insert into public.cards (code_hash) values (v_hash) on conflict do nothing;
  end if;

  select cells into v_stored from public.cards where code_hash = v_hash for update;

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into v_merged
  from (
    select distinct on (k) k, v
    from (
      select key as k, value as v from jsonb_each(v_stored)
      union all
      select key,
             jsonb_build_object(
               'done', (value ->> 'done')::boolean,
               'at',   least((value ->> 'at')::numeric, v_now_ms + 60000)
             )
      from jsonb_each(p_cells)
      where key ~ '^[a-z0-9-]{1,40}$'
        and jsonb_typeof(value) = 'object'
        and jsonb_typeof(value -> 'done') = 'boolean'
        and jsonb_typeof(value -> 'at') = 'number'
    ) incoming
    order by k, (v ->> 'at')::numeric desc
  ) latest;

  if (select count(*) from jsonb_object_keys(v_merged)) > 100 then
    raise exception 'too many cells';
  end if;

  update public.cards
     set cells = v_merged, updated_at = now()
   where code_hash = v_hash and cells is distinct from v_merged;

  return v_merged;
end;
$$;

revoke all on function public.sync_card(text, jsonb) from public;
grant execute on function public.sync_card(text, jsonb) to anon, authenticated;
