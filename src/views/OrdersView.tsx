import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { UserProfile, Order } from '../types';
import {
  getOrders,
  confirmOrder,
  rejectOrder
} from '../services/firebase';

interface OrdersViewProps {
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent'>('all');

  // Preview Proof Modal
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Reject Modal
  const [rejectOrderTarget, setRejectOrderTarget] = useState<Order | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [successConfirmModal, setSuccessConfirmModal] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const all = await getOrders();
      const isAdmin = currentUser.role === 'admin' || currentUser.email === 'horlandobe@gmail.com';
      if (isAdmin) {
        setOrders(all);
      } else {
        setOrders(all.filter(o => o.vendeurUid === currentUser.uid || o.acheteurUid === currentUser.uid));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handleUpdate = () => fetchOrders();
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, [currentUser.uid]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'received') return o.vendeurUid === currentUser.uid;
    if (activeTab === 'sent') return o.acheteurUid === currentUser.uid;
    return true;
  });

  const handleConfirm = async (order: Order) => {
    if (!window.confirm(`Confirmez-vous avoir bien reçu le paiement de ${order.prix.toLocaleString('fr-FR')} Ar sur votre compte pour l'e-mail ${order.adresseEmailVendue} ?`)) {
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await confirmOrder(order.orderId, currentUser.uid);
      setSuccessConfirmModal(order.reference);
      fetchOrders();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de la confirmation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectOrderTarget || !motifRefus.trim()) {
      setActionError("Le motif du refus est obligatoire.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await rejectOrder(rejectOrderTarget.orderId, motifRefus.trim(), currentUser.uid);
      setActionSuccess(`La commande ${rejectOrderTarget.reference} a été refusée.`);
      setRejectOrderTarget(null);
      setMotifRefus('');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchOrders();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors du rejet.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Espace Commandes
          </h1>
          <p className="text-xs text-slate-500">
            Vérifiez les preuves de transaction, confirmez la réception des fonds et gérez les ventes.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'received' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ventes reçues ({orders.filter(o => o.vendeurUid === currentUser.uid).length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sent' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Achats passés ({orders.filter(o => o.acheteurUid === currentUser.uid).length})
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Chargement des commandes...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Aucune commande pour le moment</h3>
          <p className="text-xs text-slate-500">Les commandes d'e-mails apparaîtront ici dès leur initiation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isSeller = order.vendeurUid === currentUser.uid;
            const isBuyer = order.acheteurUid === currentUser.uid;
            const isAdmin = currentUser.role === 'admin' || currentUser.email === 'horlandobe@gmail.com';
            const canManage = isSeller || isAdmin;

            return (
              <div
                key={order.orderId}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-blue-100 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-slate-900">
                      Réf : {order.reference}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.statutCommande === 'paiement_confirme'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.statutCommande === 'paiement_refuse'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.statutCommande === 'en_attente_paiement' && 'En attente de paiement'}
                      {order.statutCommande === 'en_attente_verification' && 'Vérification en cours'}
                      {order.statutCommande === 'paiement_confirme' && 'Paiement confirmé'}
                      {order.statutCommande === 'paiement_refuse' && 'Paiement refusé'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Date : {new Date(order.dateCreation).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(order.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Col 1 */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">E-mail Concerné</span>
                    <div className="font-mono font-bold text-slate-900 break-all">{order.adresseEmailVendue}</div>
                    <div className="text-blue-600 font-extrabold text-sm">
                      {order.prix.toLocaleString('fr-FR')} Ariary
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Parties</span>
                    <div>Vendeur : <strong>{order.vendeurNom}</strong></div>
                    <div>Acheteur : <strong>{order.acheteurNom}</strong></div>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Coordonnées Vendeur</span>
                    <div>Numéro : <span className="font-mono font-bold">{order.numeroPaiement}</span></div>
                    <div>Titulaire : {order.nomTitulairePaiement}</div>
                  </div>

                  {/* Col 4: Preuve de paiement */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Preuve de Paiement</span>
                    {order.preuvePaiementUrl ? (
                      <button
                        onClick={() => setPreviewProofUrl(order.preuvePaiementUrl || null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspecter le reçu</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Aucune preuve transmise</span>
                    )}
                  </div>
                </div>

                {/* If refused motif */}
                {order.statutCommande === 'paiement_refuse' && order.motifRefus && (
                  <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800">
                    <strong>Motif du refus communiqué :</strong> {order.motifRefus}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    {order.statutCommande === 'en_attente_verification' && (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Preuve transmise par le client. En attente de confirmation du vendeur.</span>
                      </span>
                    )}
                    {order.statutCommande === 'paiement_confirme' && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Transaction complétée. Mot de passe accessible à l'acheteur.</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Buyer can download PDF if confirmed */}
                    {isBuyer && order.statutCommande === 'paiement_confirme' && (
                      <button
                        onClick={() => onNavigate('purchases')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Obtenir mon PDF (« Mes achats »)</span>
                      </button>
                    )}

                    {/* Seller / Admin can confirm or reject if pending verification or payment */}
                    {canManage && ['en_attente_paiement', 'en_attente_verification'].includes(order.statutCommande) && (
                      <>
                        <button
                          onClick={() => handleConfirm(order)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirmer réception des fonds</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectOrderTarget(order);
                            setMotifRefus('');
                          }}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Refuser</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800">Preuve de paiement transmise</span>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕ Fermer
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewProofUrl}
                alt="Reçu de paiement"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Motif Modal */}
      {rejectOrderTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Refuser le paiement de la commande</h3>
              <button
                onClick={() => setRejectOrderTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Vous devez impérativement renseigner le <strong>motif du refus</strong>. Cette explication sera transmise immédiatement à l'acheteur.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={4}
                required
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex : Référence introuvable sur le relevé Mobile Money, montant reçu incomplet, capture illisible..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectOrderTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !motifRefus.trim()}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {actionLoading ? 'Traitement...' : 'Confirmer le refus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Confirmation Animation Modal */}
      {successConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Paiement Confirmé !</h3>
              <p className="text-xs text-slate-500">
                La commande <strong>{successConfirmModal}</strong> a été validée avec succès. L'e-mail a été marqué comme vendu et les identifiants ont été délivrés à l'acheteur.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccessConfirmModal(null);
                fetchOrders();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Fermer & Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
