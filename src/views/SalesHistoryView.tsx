import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Search, ArrowRight, Lock } from 'lucide-react';
import { SalesHistory, UserProfile } from '../types';
import { getSalesHistory } from '../services/firebase';

interface SalesHistoryViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [sales, setSales] = useState<SalesHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getSalesHistory();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    const handleUpdate = () => fetchSales();
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, []);

  const filteredSales = sales.filter(s => {
    const q = search.toLowerCase();
    return (
      s.adresseEmail.toLowerCase().includes(q) ||
      s.vendeurNom.toLowerCase().includes(q) ||
      s.orderId.toLowerCase().includes(q)
    );
  });

  const totalVolumeAr = sales.reduce((acc, curr) => acc + (curr.prixFinal || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Registre Public des Transactions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Historique des Ventes Réalisées
          </h1>
          <p className="text-xs text-slate-500">
            Traçabilité transparente de toutes les adresses e-mails vendues avec succès. Les mots de passe ne sont jamais divulgués ici.
          </p>
        </div>

        {/* Total stats */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-right w-full sm:w-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Volume Total Échangé</span>
          <span className="text-lg font-black text-blue-600">
            {totalVolumeAr.toLocaleString('fr-FR')} Ar
          </span>
          <span className="text-[10px] text-slate-500 block">
            {sales.length} transaction(s) réussie(s)
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par adresse vendue ou vendeur..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Garantie de non-réutilisation stricte
        </div>
      </div>

      {/* Sales Table / Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Chargement de l'historique...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Aucune vente archivée</h3>
          <p className="text-xs text-slate-500">Les ventes finalisées apparaîtront dans cette liste.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-4 px-6">Adresse e-mail vendue</th>
                  <th className="py-4 px-6">Vendeur</th>
                  <th className="py-4 px-6">Prix de vente</th>
                  <th className="py-4 px-6">Date de vente</th>
                  <th className="py-4 px-6">Statut & Sécurité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSales.map((sale) => (
                  <tr key={sale.saleId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-900 break-all">
                        {sale.adresseEmail}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Réf Commande : {sale.orderId}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {sale.vendeurNom}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-blue-600">
                        {sale.prixFinal.toLocaleString('fr-FR')} Ar
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(sale.dateVente).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(sale.dateVente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Vendu & Définitif</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Protégé par certificat</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
