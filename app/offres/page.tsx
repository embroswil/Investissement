import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

type Offer = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  asset: string;
  market: string;
  price_xaf: number;
  period: string;
  description: string | null;
};

export default async function OffresPage({
  searchParams
}: {
  searchParams: { asset?: string; market?: string };
}) {
  const { asset, market } = searchParams;
  // Client non typé : les tables offers/trade_results ne sont pas dans types_db.ts
  const supabase: any = createClient();

  let query = supabase.from('offers').select('*').order('asset');
  if (asset) query = query.eq('asset', asset);
  if (market) query = query.eq('market', market);
  const { data } = await query;
  const offers = (data ?? []) as Offer[];

  const { data: all } = await supabase.from('offers').select('asset, market');
  const assets: string[] = Array.from(
    new Set<string>((all ?? []).map((o: any) => o.asset as string))
  );
  const markets: string[] = Array.from(
    new Set<string>((all ?? []).map((o: any) => o.market as string))
  );

  const chip = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active ? 'bg-lime-300 text-emerald-950' : 'bg-emerald-900/40 text-emerald-100'
    }`;

  return (
    <main className="min-h-screen bg-emerald-950 px-4 py-6 text-emerald-50">
      <h1 className="text-2xl font-semibold">Nos offres</h1>
      <p className="mt-1 text-sm text-emerald-200/80">
        Abonnements à prix fixe : signaux, analyses et formations. Aucune
        promesse de gain. Les performances passées ne garantissent pas les
        résultats futurs.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/offres" className={chip(!asset && !market)}>
          Tout
        </Link>
        {assets.map((a) => (
          <Link key={a} href={`/offres?asset=${a}`} className={chip(asset === a)}>
            {a}
          </Link>
        ))}
        {markets.map((m) => (
          <Link key={m} href={`/offres?market=${m}`} className={chip(market === m)}>
            {m}
          </Link>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {offers.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-emerald-800 bg-emerald-900/50 p-4"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{o.title}</h2>
              <span className="text-sm text-emerald-200/80">
                {o.asset} · {o.market}
              </span>
            </div>
            {o.description && (
              <p className="mt-2 text-sm text-emerald-100/90">{o.description}</p>
            )}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-xl font-bold text-lime-300">
                  {o.price_xaf.toLocaleString('fr-FR')} XAF
                </div>
                <div className="text-xs text-emerald-200/70">{o.period}</div>
              </div>
              <Link
                href={`/offres/${o.slug}`}
                className="rounded-lg bg-lime-300 px-4 py-2 font-medium text-emerald-950"
              >
                Voir l'offre
              </Link>
            </div>
          </li>
        ))}
        {offers.length === 0 && (
          <li className="text-emerald-200/80">
            Aucune offre pour ce filtre. Retire un filtre pour tout afficher.
          </li>
        )}
      </ul>
    </main>
  );
}
