import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase: any = createClient();
  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(3);
  const { data: results } = await supabase
    .from('trade_results')
    .select('*')
    .order('opened_at', { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen bg-emerald-950 px-4 py-8 text-emerald-50">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">EMBROSWILL</h1>
        <p className="mt-2 text-emerald-100/90">
          Signaux, analyses et formations de trading crypto, par abonnement à
          prix fixe. Nous ne gérons pas votre argent et ne promettons aucun
          gain.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href="/offres" className="rounded-lg bg-lime-300 px-4 py-2 font-medium text-emerald-950">
            Voir les offres
          </Link>
          <Link href="/resultats" className="rounded-lg border border-emerald-700 px-4 py-2">
            Nos résultats
          </Link>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Dernières offres</h2>
        <ul className="mt-3 grid gap-3">
          {(offers ?? []).map((o: any) => (
            <li key={o.id} className="rounded-xl border border-emerald-800 bg-emerald-900/50 p-4">
              <div className="flex justify-between">
                <span className="font-semibold">{o.title}</span>
                <span className="text-sm text-emerald-200/80">{o.asset} · {o.market}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold text-lime-300">
                  {Number(o.price_xaf).toLocaleString('fr-FR')} XAF / {o.period}
                </span>
                <Link href={`/offres/${o.slug}`} className="text-sm underline">Détails</Link>
              </div>
            </li>
          ))}
          {(offers ?? []).length === 0 && (
            <li className="text-emerald-200/80">Aucune offre publiée pour le moment.</li>
          )}
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Derniers trades publiés</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {(results ?? []).map((r: any) => (
            <li key={r.id} className="flex justify-between rounded-lg bg-emerald-900/40 px-3 py-2">
              <span>{r.asset} · {r.direction}</span>
              <span className={Number(r.result_pct) >= 0 ? 'text-lime-300' : 'text-red-300'}>
                {r.result_pct === null ? 'en cours' : `${Number(r.result_pct).toFixed(2)} %`}
              </span>
            </li>
          ))}
          {(results ?? []).length === 0 && (
            <li className="text-emerald-200/80">Aucun trade publié pour le moment.</li>
          )}
        </ul>
        <p className="mt-8 text-xs text-emerald-200/60">
          Le trading de crypto-actifs comporte un risque de perte en capital.
          Les performances passées ne préjugent pas des performances futures.
        </p>
      </section>
    </main>
  );
}
