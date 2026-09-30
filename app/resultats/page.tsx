import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ResultatsPage() {
  const supabase: any = createClient();
  const { data } = await supabase
    .from('trade_results')
    .select('*')
    .order('opened_at', { ascending: false });
  const rows: any[] = data ?? [];
  const closed = rows.filter((r) => r.result_pct !== null);
  const wins = closed.filter((r) => Number(r.result_pct) > 0).length;

  return (
    <main className="min-h-screen bg-emerald-950 px-4 py-8 text-emerald-50">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Résultats publiés</h1>
        <p className="mt-1 text-sm text-emerald-200/80">
          Historique complet, pertes comprises, avec une preuve pour chaque trade.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-emerald-900/50 p-3">
            <div className="text-xl font-bold">{rows.length}</div>trades
          </div>
          <div className="rounded-lg bg-emerald-900/50 p-3">
            <div className="text-xl font-bold">{closed.length}</div>clôturés
          </div>
          <div className="rounded-lg bg-emerald-900/50 p-3">
            <div className="text-xl font-bold">
              {closed.length ? Math.round((wins / closed.length) * 100) + ' %' : '—'}
            </div>
            gagnants
          </div>
        </div>
        <ul className="mt-6 grid gap-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-emerald-800 bg-emerald-900/40 p-3">
              <div className="flex justify-between">
                <span className="font-medium">{r.asset} · {r.direction}</span>
                <span className={r.result_pct === null ? '' : Number(r.result_pct) >= 0 ? 'text-lime-300' : 'text-red-300'}>
                  {r.result_pct === null ? 'en cours' : `${Number(r.result_pct).toFixed(2)} %`}
                </span>
              </div>
              <div className="mt-1 text-emerald-200/70">
                Entrée {r.entry_price}{r.exit_price !== null ? ` → sortie ${r.exit_price}` : ''}
                {' · '}
                <a href={r.proof_url} target="_blank" rel="noopener noreferrer" className="underline">preuve</a>
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="text-emerald-200/80">Aucun trade publié pour le moment.</li>}
        </ul>
        <p className="mt-8 text-xs text-emerald-200/60">
          Les performances passées ne préjugent pas des performances futures.
        </p>
      </div>
    </main>
  );
}
