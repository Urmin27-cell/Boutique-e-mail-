import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Mail,
  ShoppingBag,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Lock,
  Search,
  Star,
  FileText,
  DollarSign,
  TrendingUp,
  LogOut,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import {
  UserProfile,
  EmailListing,
  Order,
  SalesHistory,
  SubscriptionRequest,
  ReactivationRequest,
  AdminAuditLog
} from '../types';
import {
  getAllUsers,
  getEmailListings,
  getOrders,
  getSalesHistory,
  getSubscriptionRequests,
  confirmSubscription,
  rejectSubscription,
  getReactivationRequests,
  confirmReactivation,
  rejectReactivation,
  updateUserAccountStatus,
  deleteUserAccountSafely,
  getAdminAuditLogs
} from '../services/firebase';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
  onSignOut: () => void;
  onNavigate: (view: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onSignOut,
  onNavigate,
}) => {
  const isAdmin = currentUser.role === 'admin' ||
    currentUser.email?.toLowerCase() === 'horlandobe@gmail.com' ||
    currentUser.email?.toLowerCase() === 'madanexora@gmail.com';

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'reactivations' | 'orders' | 'logs'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<EmailListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<SalesHistory[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [reactivationRequests, setReactivationRequests] = useState<ReactivationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Reject / Reason Modal
  const [rejectContext, setRejectContext] = useState<{
    type: 'subscription' | 'reactivation';
    id: string;
    title: string;
  } | null>(null);
  const [motifText, setMotifText] = useState('');

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [u, l, o, s, subs, reacts, logs] = await Promise.all([
        getAllUsers(),
        getEmailListings(),
        getOrders(),
        getSalesHistory(),
        getSubscriptionRequests(),
        getReactivationRequests(),
        getAdminAuditLogs()
      ]);

      setUsers(u);
      setListings(l);
      setOrders(o);
      setSales(s);
      setSubscriptionRequests(subs);
      setReactivationRequests(reacts);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
    const handleUpdate = () => {
      if (isAdmin) fetchAdminData();
    };
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl shadow-xl text-center space-y-4 border border-red-100">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Accès Restreint</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Seul le compte administrateur autorisé (<code>horlandobe@gmail.com</code>) peut accéder à cet espace de gestion.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Retourner à l'accueil
        </button>
      </div>
    );
  }

  // Real KPI metrics from Section 20-A
  const totalUsers = users.length;
  const totalSellers = users.filter(u => u.role === 'vendeur' || listings.some(l => l.vendeurUid === u.uid)).length;
  const emailsDisponibles = listings.filter(l => l.statutAnnonce === 'disponible').length;
  const emailsVendus = listings.filter(l => l.statutAnnonce === 'vendu').length + sales.length;
  const pendingOrders = orders.filter(o => ['en_attente_paiement', 'en_attente_verification'].includes(o.statutCommande)).length;
  const completedOrders = orders.filter(o => o.statutCommande === 'paiement_confirme').length;
  const suspendedUsers = users.filter(u => u.statutCompte === 'suspendu').length;
  const pendingSubscriptions = subscriptionRequests.filter(s => s.statut === 'en_attente_confirmation').length;
  const pendingReactivations = reactivationRequests.filter(r => r.statut === 'en_attente_confirmation').length;

  const handleApproveSub = async (reqId: string) => {
    if (!window.confirm("Valider l'abonnement de 30 jours (2 500 Ar) pour cet utilisateur ?")) return;
    try {
      await confirmSubscription(reqId, currentUser.uid);
      fetchAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleApproveReactivation = async (reqId: string) => {
    if (!window.confirm("Confirmer la réactivation de ce compte suspendu (20 000 Ar validés) ?")) return;
    try {
      await confirmReactivation(reqId, currentUser.uid);
      fetchAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleRejectActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectContext || !motifText.trim()) return;

    try {
      if (rejectContext.type === 'subscription') {
        await rejectSubscription(rejectContext.id, motifText.trim(), currentUser.uid);
      } else {
        await rejectReactivation(rejectContext.id, motifText.trim(), currentUser.uid);
      }
      setRejectContext(null);
      setMotifText('');
      fetchAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors du rejet.");
    }
  };

  const handleUserStatusToggle = async (targetUser: UserProfile, newStatus: 'actif' | 'suspendu' | 'bloque') => {
    const reason = window.prompt(`Indiquez le motif de ce changement de statut (${newStatus.toUpperCase()}) :`);
    if (reason === null) return;
    try {
      await updateUserAccountStatus(targetUser.uid, newStatus, reason, currentUser);
      fetchAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserAccountSafely(userToDelete.uid, currentUser);
      setUserToDelete(null);
      fetchAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return (
      u.nomComplet.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.telephone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Panneau d'Administration Suprême</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Espace d'Administration BOUTIQUE E-MAIL
          </h1>
          <p className="text-xs text-slate-400">
            Connecté en tant que <strong>{currentUser.email}</strong>. Contrôle total de la plateforme, des flux financiers et des sanctions.
          </p>
        </div>

        {/* Exclusive Logout button for horlandobe@gmail.com */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter (Admin)</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          Vue d'ensemble
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Gestion Utilisateurs ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'subscriptions' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Abonnements ({pendingSubscriptions} en attente)</span>
        </button>

        <button
          onClick={() => setActiveTab('reactivations')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'reactivations' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Réactivations ({pendingReactivations} en attente)</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Toutes les Commandes ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journal d'Audit</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW WITH ALL 9 METRICS FROM SPEC 20-A */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Nombre Total d'Utilisateurs</span>
              <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
              <span className="text-[11px] text-slate-500">Inscrits avec Firebase Auth</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Nombre de Vendeurs</span>
              <div className="text-2xl font-black text-indigo-600">{totalSellers}</div>
              <span className="text-[11px] text-slate-500">Ayant publié des offres</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Emails Disponibles</span>
              <div className="text-2xl font-black text-blue-600">{emailsDisponibles}</div>
              <span className="text-[11px] text-slate-500">En vente dans la boutique</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Emails Vendus</span>
              <div className="text-2xl font-black text-emerald-600">{emailsVendus}</div>
              <span className="text-[11px] text-slate-500">Transactions confirmées & scellées</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Commandes en Attente</span>
              <div className="text-2xl font-black text-amber-600">{pendingOrders}</div>
              <span className="text-[11px] text-slate-500">En attente de paiement/reçu</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Commandes Terminées</span>
              <div className="text-2xl font-black text-emerald-600">{completedOrders}</div>
              <span className="text-[11px] text-slate-500">Certificats PDF délivrés</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Comptes Suspendus</span>
              <div className="text-2xl font-black text-red-600">{suspendedUsers}</div>
              <span className="text-[11px] text-slate-500">20 notes négatives ou sanction</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Demandes d'Abonnement en Attente</span>
              <div className="text-2xl font-black text-blue-600">{pendingSubscriptions}</div>
              <span className="text-[11px] text-slate-500">2 500 Ar / mois à valider</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Demandes de Réactivation en Attente</span>
              <div className="text-2xl font-black text-red-600">{pendingReactivations}</div>
              <span className="text-[11px] text-slate-500">20 000 Ar à vérifier</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900">
              Liste des Utilisateurs et Sanctions
            </h2>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher par nom, e-mail ou téléphone..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Statut Compte</th>
                  <th className="py-3 px-4">Abonnement</th>
                  <th className="py-3 px-4">Notes (+ / -)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.nomComplet}</span>
                        {u.badgeBleu && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" title="Badge Bleu" />
                        )}
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.telephone}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.statutCompte === 'actif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.statutCompte === 'suspendu'
                            ? 'bg-amber-100 text-amber-800'
                            : u.statutCompte === 'bloque'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.statutCompte}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {u.statutAbonnement}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className="text-emerald-600">+{u.nombreNotesPositives || 0}</span>
                      {' / '}
                      <span className="text-red-500">-{u.nombreNotesNegatives || 0}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {u.statutCompte !== 'actif' && (
                        <button
                          onClick={() => handleUserStatusToggle(u, 'actif')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px]"
                        >
                          Activer
                        </button>
                      )}
                      {u.statutCompte !== 'suspendu' && (
                        <button
                          onClick={() => handleUserStatusToggle(u, 'suspendu')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px]"
                        >
                          Suspendre
                        </button>
                      )}
                      {u.statutCompte !== 'bloque' && (
                        <button
                          onClick={() => handleUserStatusToggle(u, 'bloque')}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px]"
                        >
                          Bloquer
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Supprimer / Anonymiser le compte"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
            Demandes d'Abonnement Vendeur (2 500 Ar / 30 jours)
          </h2>

          {subscriptionRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune demande d'abonnement enregistrée.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subscriptionRequests.map((sub) => (
                <div key={sub.requestId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sub.utilisateurNom}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.statut === 'actif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.statut === 'refuse'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.statut}
                      </span>
                    </div>
                    <div className="text-slate-500">{sub.utilisateurEmail}</div>
                    <div className="text-[11px] text-blue-600 font-bold">
                      Montant : {sub.montant.toLocaleString('fr-FR')} Ar
                    </div>
                    {sub.motifRefus && (
                      <div className="text-red-600 text-[10px]">Motif refus : {sub.motifRefus}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewProofUrl(sub.preuvePaiementUrl)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Voir le reçu</span>
                    </button>

                    {sub.statut === 'en_attente_confirmation' && (
                      <>
                        <button
                          onClick={() => handleApproveSub(sub.requestId)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                          Confirmer (30j)
                        </button>
                        <button
                          onClick={() => {
                            setRejectContext({
                              type: 'subscription',
                              id: sub.requestId,
                              title: `Refuser l'abonnement de ${sub.utilisateurNom}`
                            });
                            setMotifText('');
                          }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REACTIVATIONS */}
      {activeTab === 'reactivations' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
            Demandes de Réactivation de Comptes Suspendus (20 000 Ar)
          </h2>

          {reactivationRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune demande de réactivation pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reactivationRequests.map((react) => (
                <div key={react.requestId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{react.utilisateurNom}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          react.statut === 'actif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : react.statut === 'refuse'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {react.statut}
                      </span>
                    </div>
                    <div className="text-slate-500">{react.utilisateurEmail}</div>
                    <div className="text-[11px] text-red-600 font-bold">
                      Frais de réactivation réglés : {react.montant.toLocaleString('fr-FR')} Ar
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewProofUrl(react.preuvePaiementUrl)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reçu 20 000 Ar</span>
                    </button>

                    {react.statut === 'en_attente_confirmation' && (
                      <>
                        <button
                          onClick={() => handleApproveReactivation(react.requestId)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                          Réactiver le compte
                        </button>
                        <button
                          onClick={() => {
                            setRejectContext({
                              type: 'reactivation',
                              id: react.requestId,
                              title: `Refuser la réactivation de ${react.utilisateurNom}`
                            });
                            setMotifText('');
                          }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ALL ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
            Toutes les Commandes Réseau
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Réf</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Vendeur</th>
                  <th className="py-3 px-4">Acheteur</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Preuve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold">{o.reference}</td>
                    <td className="py-3 px-4 font-mono">{o.adresseEmailVendue}</td>
                    <td className="py-3 px-4">{o.vendeurNom}</td>
                    <td className="py-3 px-4">{o.acheteurNom}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">{o.prix.toLocaleString('fr-FR')} Ar</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100">
                        {o.statutCommande}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {o.preuvePaiementUrl ? (
                        <button
                          onClick={() => setPreviewProofUrl(o.preuvePaiementUrl || null)}
                          className="text-blue-600 underline text-[11px]"
                        >
                          Voir preuve
                        </button>
                      ) : (
                        <span className="text-slate-400">Aucune</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
            Journal de Traçabilité & Audit Administrateur
          </h2>
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune action consignée pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.logId} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    {log.details && <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>}
                    <span className="text-[10px] text-slate-400">Par {log.adminEmail}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.dateCreation).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(log.dateCreation).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof Preview Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900">Preuve de paiement soumise</span>
              <button onClick={() => setPreviewProofUrl(null)} className="text-xs font-bold text-slate-400">
                ✕ Fermer
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden flex items-center justify-center bg-slate-100 rounded-2xl">
              <img src={previewProofUrl} alt="Preuve" className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectContext && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">{rejectContext.title}</h3>
            <p className="text-xs text-slate-600">
              Veuillez préciser le <strong>motif du refus</strong> qui sera communiqué à l'utilisateur :
            </p>
            <form onSubmit={handleRejectActionSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={motifText}
                onChange={(e) => setMotifText(e.target.value)}
                placeholder="Ex : Référence de transfert introuvable sur le relevé..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectContext(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!motifText.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirmer le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm User Delete Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">
                Confirmation de suppression du compte
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Êtes-vous certain de vouloir supprimer le compte de <strong>{userToDelete.nomComplet}</strong> ({userToDelete.email}) ?
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left mt-2">
                <strong>Sécurité & Traçabilité financière :</strong> Les données personnelles seront anonymisées. Les transactions passées et l'historique financier resteront protégés pour empêcher qu'un e-mail déjà vendu ne soit remis en circulation.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmer la suppression sécurisée
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
