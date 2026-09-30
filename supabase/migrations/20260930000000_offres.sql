-- Offres de services (signaux, analyses, formations) par crypto et par marché.
-- Aucun solde, dépôt ni retrait : abonnement à prix fixe uniquement.

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  kind text not null check (kind in ('signaux', 'analyse', 'formation')),
  asset text not null,            -- BTC, ETH, SOL...
  market text not null,           -- spot, futures, memecoins...
  price_xaf integer not null check (price_xaf >= 0),
  period text not null default 'mensuel' check (period in ('mensuel', 'trimestriel', 'annuel', 'unique')),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.offer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  offer_id uuid not null references public.offers on delete restrict,
  status text not null default 'en_attente' check (status in ('en_attente', 'actif', 'expire', 'annule')),
  started_at timestamptz,
  ends_at timestamptz,
  payment_ref text,               -- rempli quand le paiement sera branché
  created_at timestamptz not null default now()
);

-- Historique public et vérifiable des trades de l'équipe (performances passées).
create table public.trade_results (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.offers on delete set null,
  asset text not null,
  direction text not null check (direction in ('achat', 'vente')),
  entry_price numeric not null,
  exit_price numeric,
  result_pct numeric,
  opened_at timestamptz not null,
  closed_at timestamptz,
  proof_url text,                 -- lien explorateur / capture vérifiable
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;
alter table public.offer_subscriptions enable row level security;
alter table public.trade_results enable row level security;

create policy "offres visibles par tous" on public.offers
  for select using (active);

create policy "résultats visibles par tous" on public.trade_results
  for select using (true);

create policy "chacun voit ses abonnements" on public.offer_subscriptions
  for select using (auth.uid() = user_id);
