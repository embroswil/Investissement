import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function OffrePage({ params }: { params: { slug: string } }) {
  const supabase: any = createClient();
  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!offer) notFound();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  let status: string | null = null;
  if (user) {
    const { data: sub } = await supabase
      .from('offer_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('offer_id', offer.id)
      .maybeSingle();
    status = sub ? sub.status : null;
  }

  async function demander() {
    'use server';
    const s: any = createClient();
    const {
      data: { user: u }
    } = await s.auth.getUser();
    if (!u) redirect('/signin');
    await s
      .from('offer_subscriptions')
      .upsert(
        { user_id: u.id, offer_id: offer.id, status: 'en_attente' },
        { onConflict: 'user_id,offer_id', ignoreDuplicates: true }
      );
    revalidatePath(`/offres/${offer.slug}`);
  }

  return (
    <main className="min-h-screen bg-emerald-950 px-4 py-8 text-emerald-50">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-emerald-200/80">
          {offer.kind} · {offer.asset} · {offer.market}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{offer.title}</h1>
        {offer.description && <p className="mt-3 text-emerald-100/90">{offer.description}</p>}
        <div className="mt-5 text-2xl font-bold text-lime-300">
          {Number(offer.price_xaf).toLocaleString('fr-FR')} XAF
          <span className="ml-2 text-sm font-normal text-emerald-200/70">{offer.period}</span>
        </div>

        {status ? (
          <p className="mt-6 rounded-lg bg-emerald-900/50 p-4 text-sm">
            Statut de ta demande : <strong>{status}</strong>.
            {status === 'en_attente' && ' Le paiement en ligne sera disponible prochainement ; nous te contacterons.'}
          </p>
        ) : (
          <form action={demander} className="mt-6">
            <button className="rounded-lg bg-lime-300 px-5 py-2.5 font-medium text-emerald-950">
              {user ? "Demander l'accès" : 'Se connecter pour demander l\'accès'}
            </button>
          </form>
        )}
        <p className="mt-8 text-xs text-emerald-200/60">
          Service d'information et de formation. Aucun rendement n'est garanti ;
          le trading comporte un risque de perte en capital.
        </p>
      </div>
    </main>
  );
}
