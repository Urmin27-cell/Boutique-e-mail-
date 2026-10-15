import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Sparkles,
  Activity,
  RefreshCw,
  Users,
  Database
} from 'lucide-react';
import { UserProfile, EmailListing, Order, SalesHistory, AppNotification } from '../types';
import {
  getEmailListings,
  getOrders,
  getSalesHistory,
  checkSellerSubscriptionStatus,
  getUserNotifications,
  purgeAllDemoData
} from '../services/firebase';

interface DashboardViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  onOpenSubscriptionModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenSubscriptionModal,
}) => {
  const [allListings, setAllListings] = useState<EmailListing[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allSales, setAllSales] = useState<SalesHistory[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString('fr-FR'));

  // View Mode: if logged in, allow toggling between personal and global
  const [viewScope, setViewScope] = useState<'personal' | 'global'>(currentUser ? 'personal' : 'global');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [listingsData, ordersData, salesData] = await Promise.all([
        getEmailListings(),
        getOrders(),
        getSalesHistory(),
      ]);

      setAllListings(listingsData);
      setAllOrders(ordersData);
      setAllSales(salesData);
      setLastRefreshed(new Date().toLocaleTimeString('fr-FR'));

      if (currentUser) {
        const notifs = await getUserNotifications(currentUser.uid);
        setNotifications(notifs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, [currentUser?.uid]);

  // Personal scope metrics
  const myListings = currentUser ? allListings.filter(l => l.vendeurUid === currentUser.uid) : [];
  const myOrders = currentUser
    ? allOrders.filter(o => o.acheteurUid === currentUser.uid || o.vendeurUid === currentUser.uid)
    : [];
  const mySales = currentUser
    ? allSales.filter(s => s.acheteurUid === currentUser.uid || s.vendeurUid === currentUser.uid)
    : [];

  const sub = currentUser ? checkSellerSubscriptionStatus(currentUser) : null;

  // Real data calculations according to scope (no demo data, no double-counting)
  const isPersonal = currentUser && viewScope === 'personal';

  const emailsDisponiblesCount = isPersonal
    ? myListings.filter(l => l.statutAnnonce === 'disponible').length
    : allListings.filter(l => l.statutAnnonce === 'disponible').length;

  const emailsVendusCount = isPersonal
    ? mySales.filter(s => s.vendeurUid === currentUser?.uid).length
    : allSales.length;

  const commandesEnAttenteCount = isPersonal
    ? myOrders.filter(o => ['en_attente_paiement', 'en_attente_verification'].includes(o.statutCommande)).length
    : allOrders.filter(o => ['en_attente_paiement', 'en_attente_verification'].includes(o.statutCommande)).length;

  const commandesTermineesCount = isPersonal
    ? myOrders.filter(o => o.statutCommande === 'paiement_confirme').length
    : allOrders.filter(o => o.statutCommande === 'paiement_confirme').length;

  // Breakdown by provider in real time
  const currentListingsPool = isPersonal ? myListings : allListings;
  const gmailCount = currentListingsPool.filter(l => l.adresseEmail.includes('gmail.com')).length;
  const outlookCount = currentListingsPool.filter(l => l.adresseEmail.includes('outlook.com')).length;
  const yahooCount = currentListingsPool.filter(l => l.adresseEmail.includes('yahoo.com')).length;

  const totalVolumeAr = (isPersonal ? mySales.filter(s => s.vendeurUid === currentUser?.uid) : allSales)
    .reduce((sum, s) => sum + (s.prixFinal || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner with Real-Time Live Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>DONNÉES EN TEMPS RÉEL (FIRESTORE)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Dernière synchro : {lastRefreshed}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tableau de Bord & Statistiques
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser
              ? `Connecté en tant que ${currentUser.nomComplet}. Suivez vos indicateurs et le volume global des transactions.`
              : 'Consultez les statistiques en temps réel de la plateforme BOUTIQUE E-MAIL.'}
          </p>
        </div>

        {/* Controls / Scope Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {currentUser && (
            <div className="p-1 bg-slate-100 rounded-2xl flex items-center">
              <button
                onClick={() => setViewScope('personal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewScope === 'personal'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mon Compte
              </button>
              <button
                onClick={() => setViewScope('global')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewScope === 'global'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toute la Plateforme
              </button>
            </div>
          )}

          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Rafraîchir les données en direct"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Subscription Banner if seller is logged in */}
      {currentUser && sub && (
        <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          sub.isExpired
            ? 'bg-amber-50/90 border-amber-200'
            : 'bg-blue-50/80 border-blue-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold ${
              sub.isExpired ? 'bg-amber-600' : 'bg-blue-600'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Statut de votre abonnement vendeur</div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                {sub.message}
              </div>
            </div>
          </div>

          {sub.isExpired ? (
            <button
              onClick={onOpenSubscriptionModal}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              Hanao abonnement (2 500 Ar)
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
              Annonces Actives dans la boutique
            </span>
          )}
        </div>
      )}

      {/* THE 4 REQUIRED CARDS (WITH REAL-TIME FIRESTORE DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Emails disponibles */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isPersonal ? 'Mes emails disponibles' : 'Emails disponibles'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {emailsDisponiblesCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Prêts pour achat immédiat</span>
          </div>
        </div>

        {/* Card 2: Emails vendus */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isPersonal ? 'Mes emails vendus' : 'Emails vendus'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {emailsVendusCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Transactions certifiées scellées</span>
          </div>
        </div>

        {/* Card 3: Commandes en attente */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isPersonal ? 'Mes commandes en cours' : 'Commandes en attente'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {commandesEnAttenteCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            En attente de preuve ou validation
          </div>
        </div>

        {/* Card 4: Commandes terminées */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isPersonal ? 'Mes commandes terminées' : 'Commandes terminées'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {commandesTermineesCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Paiements vérifiés & PDF délivrés
          </div>
        </div>
      </div>

      {/* Real-time Exchange Volume & Provider Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total volume */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Volume Total des Ventes</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {totalVolumeAr.toLocaleString('fr-FR')} <span className="text-sm font-bold">Ar</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Montant cumulé des paiements confirmés réglés aux vendeurs sur leurs comptes Mobile Money.
          </p>
        </div>

        {/* Distribution of emails */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Répartition des E-mails par Fournisseur
            </h3>
            <span className="text-xs text-slate-400 font-medium">{allListings.length} annonce(s) totale(s)</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Gmail (@gmail.com)</span>
                <span>{gmailCount} ({allListings.length > 0 ? Math.round((gmailCount / allListings.length) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${allListings.length > 0 ? (gmailCount / allListings.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Outlook (@outlook.com)</span>
                <span>{outlookCount} ({allListings.length > 0 ? Math.round((outlookCount / allListings.length) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${allListings.length > 0 ? (outlookCount / allListings.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Yahoo (@yahoo.com)</span>
                <span>{yahooCount} ({allListings.length > 0 ? Math.round((yahooCount / allListings.length) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${allListings.length > 0 ? (yahooCount / allListings.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation actions */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-base sm:text-lg">Accès Rapide aux Espaces Métier</h3>
          <p className="text-xs text-blue-100">
            Achetez, déposez une annonce ou faites configurer vos e-mails professionnels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shadow-xs"
          >
            Boutique des E-mails
          </button>

          <button
            onClick={() => onNavigate('sell')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-xs"
          >
            + Vendre un email
          </button>

          <button
            onClick={() => onNavigate('email_pro')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors border border-white/20"
          >
            Service Email Pro
          </button>

          {currentUser ? (
            <button
              onClick={() => onNavigate('purchases')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors border border-white/20"
            >
              Mes achats (PAGNER)
            </button>
          ) : (
            <button
              onClick={() => onNavigate('auth_login')}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-colors"
            >
              Se connecter
            </button>
          )}
        </div>
      </div>

      {/* Split: Recent orders & Real-time Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              {isPersonal ? 'Vos Dernières Commandes' : 'Dernières Commandes sur la Plateforme'}
            </h3>
            <button
              onClick={() => onNavigate(currentUser ? 'orders' : 'marketplace')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>{currentUser ? 'Gérer les commandes' : 'Voir la boutique'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(isPersonal ? myOrders : allOrders).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune commande enregistrée pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(isPersonal ? myOrders : allOrders).slice(0, 5).map((order) => (
                <div key={order.orderId} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{order.reference}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.statutCommande === 'paiement_confirme'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.statutCommande === 'paiement_refuse'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.statutCommande.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="font-medium text-slate-700">{order.adresseEmailVendue}</div>
                    <div className="text-[10px] text-slate-400">
                      Vendeur : {order.vendeurNom} | Acheteur : {order.acheteurNom}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600">
                      {order.prix.toLocaleString('fr-FR')} Ar
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(order.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Sales & Verified Transactions stream */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Ventes Récentes Certifiées</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Vérifiées</span>
            </span>
          </div>

          {allSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune vente archivée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {allSales.slice(0, 4).map((sale) => (
                <div key={sale.saleId} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-900 truncate max-w-[150px]">
                      {sale.adresseEmail}
                    </span>
                    <span className="font-black text-emerald-600">
                      {sale.prixFinal.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Par {sale.vendeurNom}</span>
                    <span>{new Date(sale.dateVente).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
