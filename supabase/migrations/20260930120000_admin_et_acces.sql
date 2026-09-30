create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
create policy "admin voit sa ligne" on public.admins
  for select using (auth.uid() = user_id);

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy "admin gere les offres" on public.offers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gere les resultats" on public.trade_results
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.trade_results alter column proof_url set not null;

create unique index offer_subscriptions_user_offer_key
  on public.offer_subscriptions (user_id, offer_id);

create policy "demander un acces" on public.offer_subscriptions
  for insert with check (auth.uid() = user_id and status = 'en_attente');
create policy "admin voit les abonnements" on public.offer_subscriptions
  for select using (public.is_admin());
create policy "admin met a jour les abonnements" on public.offer_subscriptions
  for update using (public.is_admin()) with check (public.is_admin());
