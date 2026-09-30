import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function requireAdmin() {
  const supabase: any = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) redirect('/');
  return supabase;
}

export default async function AdminPage() {
  const supabase = await requireAdmin();
  const { data: offers } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
  const { data: subs } = await supabase
    .from('offer_subscriptions')
    .select('id, status, created_at, offer_id')
    .order('created_at', { ascending: false });

  async function ajouterOffre(fd: FormData) {
    'use server';
    const s = await requireAdmin();
    const title = String(fd.get('title') || '').trim();
    await s.from('offers').insert({
      slug: slugify(title) + '-' + Date.now().toString(36),
      title,
      kind: String(fd.get('kind')),
      asset: String(fd.get('asset') || '').trim().toUpperCase(),
      market: String(fd.get('market') || '').trim().toLowerCase(),
      price_xaf: parseInt(String(fd.get('price') || '0'), 10),
      period: String(fd.get('period')),
      description: String(fd.get('description') || '').trim() || null,
      active: fd.get('active') === 'on'
    });
    revalidatePath('/admin');
    revalidatePath('/offres');
    revalidatePath('/');
  }

  async function ajouterTrade(fd: FormData) {
    'use server';
    const s = await requireAdmin();
    const direction = String(fd.get('direction'));
    const entry = parseFloat(String(fd.get('entry')));
    const exitRaw = String(fd.get('exit') || '').trim();
    const exit = exitRaw === '' ? null : parseFloat(exitRaw);
    let pct: number | null = null;
    if (exit !== null && entry > 0) {
      pct = direction === 'achat' ? ((exit - entry) / entry) * 100 : ((entry - exit) / entry) * 100;
    }
    await s.from('trade_results').insert({
      asset: String(fd.get('asset') || '').trim().toUpperCase(),
      direction,
      entry_price: entry,
      exit_price: exit,
      result_pct: pct,
      opened_at: new Date(String(fd.get('opened_at'))).toISOString(),
      closed_at: exit !== null ? new Date().toISOString() : null,
      proof_url: String(fd.get('proof_url') || '').trim()
    });
    revalidatePath('/admin');
    revalidatePath('/resultats');
    revalidatePath('/');
  }

  const input = 'w-full rounded-md bg-emerald-900 px-3 py-2 text-emerald-50';

  return (
    <main className="min-h-screen bg-emerald-950 px-4 py-8 text-emerald-50">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Administration</h1>

        <h2 className="mt-6 text-lg font-semibold">Nouvelle offre</h2>
        <form action={ajouterOffre} className="mt-2 grid gap-2">
          <input name="title" required placeholder="Titre (ex. Signaux BTC futures)" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <select name="kind" className={input}>
              <option value="signaux">signaux</option>
              <option value="analyse">analyse</option>
              <option value="formation">formation</option>
            </select>
            <select name="period" className={input}>
              <option value="mensuel">mensuel</option>
              <option value="trimestriel">trimestriel</option>
              <option value="annuel">annuel</option>
              <option value="unique">unique</option>
            </select>
            <input name="asset" required placeholder="Crypto (BTC)" className={input} />
            <input name="market" required placeholder="Marché (futures)" className={input} />
          </div>
          <input name="price" type="number" min="0" required placeholder="Prix en XAF" className={input} />
          <textarea name="description" placeholder="Description" className={input} />
          <label className="text-sm"><input type="checkbox" name="active" defaultChecked /> Publier tout de suite</label>
          <button className="rounded-lg bg-lime-300 px-4 py-2 font-medium text-emerald-950">Enregistrer l'offre</button>
        </form>

        <h2 className="mt-8 text-lg font-semibold">Publier un trade (avec preuve)</h2>
        <form action={ajouterTrade} className="mt-2 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <input name="asset" required placeholder="Crypto (BTC)" className={input} />
            <select name="direction" className={input}>
              <option value="achat">achat</option>
              <option value="vente">vente</option>
            </select>
            <input name="entry" type="number" step="any" required placeholder="Prix d'entrée" className={input} />
            <input name="exit" type="number" step="any" placeholder="Prix de sortie (vide si en cours)" className={input} />
          </div>
          <input name="opened_at" type="datetime-local" required className={input} />
          <input name="proof_url" type="url" required placeholder="Lien de preuve (transaction / explorateur)" className={input} />
          <button className="rounded-lg bg-lime-300 px-4 py-2 font-medium text-emerald-950">Publier le trade</button>
        </form>
        <p className="mt-2 text-xs text-emerald-200/70">
          Le pourcentage est calculé automatiquement à partir des prix. Publie
          aussi les trades perdants : c'est ce qui rend l'historique crédible.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Offres ({(offers ?? []).length})</h2>
        <ul className="mt-2 grid gap-1 text-sm">
          {(offers ?? []).map((o: any) => (
            <li key={o.id} className="flex justify-between rounded bg-emerald-900/40 px-3 py-2">
              <span>{o.title}</span>
              <span>{o.active ? 'publiée' : 'brouillon'}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-lg font-semibold">Demandes d'accès ({(subs ?? []).length})</h2>
        <ul className="mt-2 grid gap-1 text-sm">
          {(subs ?? []).map((s: any) => (
            <li key={s.id} className="flex justify-between rounded bg-emerald-900/40 px-3 py-2">
              <span>{new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
              <span>{s.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
