import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Download,
  FileText,
  Lock,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { UserProfile, Order } from '../types';
import {
  getOrders,
  getCredentialForOrder,
  rateSeller
} from '../services/firebase';
import { generateOfficialEmailPurchasePdf } from '../lib/pdfGenerator';

interface MyPurchasesViewProps {
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
}

export const MyPurchasesView: React.FC<MyPurchasesViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Revealed password map for quick on-screen view if authorized
  const [revealedPasswords, setRevealedPasswords] = useState<{ [orderId: string]: string }>({});
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rating modal state
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const allOrders = await getOrders();
      // Buyer's private purchases only
      const myPurchases = allOrders.filter(o => o.acheteurUid === currentUser.uid);
      setPurchases(myPurchases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    const handleUpdate = () => fetchPurchases();
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, [currentUser.uid]);

  const handleDownloadPdf = async (order: Order) => {
    if (order.statutCommande !== 'paiement_confirme') return;

    setDownloadingOrderId(order.orderId);
    setErrorMsg(null);

    try {
      const { password, description } = await getCredentialForOrder(order.orderId, currentUser.uid);

      // Generate the official PDF certificate
      generateOfficialEmailPurchasePdf({
        order,
        decryptedPassword: password,
        description
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors du téléchargement du certificat PDF.");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleToggleRevealPassword = async (order: Order) => {
    if (revealedPasswords[order.orderId]) {
      // Hide
      setRevealedPasswords(prev => {
        const copy = { ...prev };
        delete copy[order.orderId];
        return copy;
      });
      return;
    }

    try {
      const { password } = await getCredentialForOrder(order.orderId, currentUser.uid);
      setRevealedPasswords(prev => ({ ...prev, [order.orderId]: password }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Accès non autorisé.");
    }
  };

  const handleRate = async (order: Order, typeNote: 'positive' | 'negative') => {
    try {
      await rateSeller({
        vendeurUid: order.vendeurUid,
        auteurUid: currentUser.uid,
        auteurNom: currentUser.nomComplet,
        orderId: order.orderId,
        typeNote
      });
      setRatingSuccess(`Merci ! Votre note ${typeNote === 'positive' ? 'positive' : 'négative'} a été prise en compte.`);
      setTimeout(() => {
        setRatingSuccess(null);
        setRatingOrder(null);
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors de l'attribution de la note.");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Mes Achats (PAGNER)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              Espace Privé
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Retrouvez tous vos e-mails achetés et téléchargez vos Certificats Officiels PDF contenant vos mots de passe.
          </p>
        </div>

        <button
          onClick={() => onNavigate('marketplace')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Explorer la boutique</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Purchases List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Chargement de vos achats...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Vous n'avez encore réalisé aucun achat</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explorez notre boutique pour trouver des adresses e-mails prestigieuses et sécurisées pour vos activités.
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
          >
            Accéder à la boutique
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const isConfirmed = purchase.statutCommande === 'paiement_confirme';
            const isRefused = purchase.statutCommande === 'paiement_refuse';
            const isPendingVerification = purchase.statutCommande === 'en_attente_verification';
            const isPendingPayment = purchase.statutCommande === 'en_attente_paiement';
            const isRevealed = Boolean(revealedPasswords[purchase.orderId]);

            return (
              <div
                key={purchase.orderId}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 hover:border-blue-200 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-slate-900">
                      Réf : {purchase.reference}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRefused
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isConfirmed && 'Paiement confirmé (PDF disponible)'}
                      {isRefused && 'Paiement refusé'}
                      {isPendingVerification && 'En attente de vérification par le vendeur'}
                      {isPendingPayment && 'En attente de paiement'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Acheté le {new Date(purchase.dateCreation).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Compte E-mail</span>
                    <div className="font-mono font-bold text-sm text-slate-900 break-all">
                      {purchase.adresseEmailVendue}
                    </div>
                    <div className="text-blue-600 font-extrabold text-sm">
                      {purchase.prix.toLocaleString('fr-FR')} Ariary
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Vendeur du Compte</span>
                    <div className="font-bold text-slate-900">{purchase.vendeurNom}</div>
                    <div className="text-slate-500 text-[11px]">
                      Paiement vers : {purchase.numeroPaiement} ({purchase.nomTitulairePaiement})
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Évaluation Vendeur</span>
                    <div className="pt-1">
                      <button
                        onClick={() => setRatingOrder(purchase)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Évaluer ce vendeur</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* If Refused */}
                {isRefused && purchase.motifRefus && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-red-700">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Motif du refus du paiement :</span>
                    </span>
                    <p className="pl-5 leading-relaxed">{purchase.motifRefus}</p>
                  </div>
                )}

                {/* If Confirmed: Access PDF and Credentials Card */}
                {isConfirmed && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-blue-50/80 border border-emerald-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="font-extrabold text-xs text-emerald-900">
                            Certificat Officiel & Identifiants Débloqués
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Votre paiement a été vérifié par le vendeur. Vous pouvez télécharger le document officiel PDF contenant le mot de passe.
                        </p>
                      </div>

                      {/* Download PDF button */}
                      <button
                        onClick={() => handleDownloadPdf(purchase)}
                        disabled={downloadingOrderId === purchase.orderId}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        {downloadingOrderId === purchase.orderId ? (
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Télécharger le Certificat PDF</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick on-screen password peek */}
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">Mot de passe du compte :</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                          {isRevealed ? revealedPasswords[purchase.orderId] : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => handleToggleRevealPassword(purchase)}
                          className="text-slate-500 hover:text-slate-700 p-1"
                          title={isRevealed ? 'Masquer' : 'Afficher'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        Pensez à changer le mot de passe immédiatement après connexion.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RATING MODAL */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Noter {ratingOrder.vendeurNom}</h3>
              <button onClick={() => setRatingOrder(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Votre avis compte pour la réputation du vendeur ({ratingOrder.adresseEmailVendue}).
            </p>

            {ratingSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
                {ratingSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRate(ratingOrder, 'positive')}
                className="py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex flex-col items-center gap-1.5 transition-all"
              >
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
                <span>Note positive (+1)</span>
              </button>

              <button
                onClick={() => handleRate(ratingOrder, 'negative')}
                className="py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex flex-col items-center gap-1.5 transition-all"
              >
                <ThumbsDown className="w-5 h-5 text-red-600" />
                <span>Note négative (-1)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
