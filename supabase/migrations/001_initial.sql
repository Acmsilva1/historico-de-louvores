-- Historico de louvores — schema inicial

create table if not exists louvor (
  id uuid primary key default gen_random_uuid(),
  numero text,
  titulo text not null,
  titulo_norm text not null,
  tipo text not null default 'hinario'
    check (tipo in ('hinario', 'cias', 'outro')),
  created_at timestamptz not null default now()
);

create unique index if not exists louvor_titulo_norm_uidx
  on louvor (titulo_norm);

create index if not exists louvor_numero_idx
  on louvor (numero);

create table if not exists culto (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  tipo text not null,
  titulo text,
  created_at timestamptz not null default now(),
  unique (data, tipo)
);

create index if not exists culto_data_idx on culto (data desc);

create table if not exists culto_louvor (
  id uuid primary key default gen_random_uuid(),
  culto_id uuid not null references culto (id) on delete cascade,
  louvor_id uuid not null references louvor (id) on delete restrict,
  ordem int not null default 1,
  unique (culto_id, ordem)
);

create index if not exists culto_louvor_louvor_idx on culto_louvor (louvor_id);
create index if not exists culto_louvor_culto_idx on culto_louvor (culto_id);

-- App usa service role no servidor; RLS ligado sem policies publicas
alter table louvor enable row level security;
alter table culto enable row level security;
alter table culto_louvor enable row level security;
