import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  ShoppingBag,
  Send,
  CheckCircle,
  AlertCircle,
  Phone,
  Globe,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';
import { UserProfile, EmailProListing, EmailProOrder } from '../types';
import {
  getEmailProListings,
  addEmailProListing,
  createEmailProOrder,
  getEmailProOrders
} from '../services/firebase';

interface EmailProViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
}

export const EmailProView: React.FC<EmailProViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [listings, setListings] = useState<EmailProListing[]>([]);
  const [myOrders, setMyOrders] = useState<EmailProOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'publish' | 'my_orders'>('browse');

  // Publish Form State
  const [prestataireNom, setPrestataireNom] = useState(currentUser?.nomComplet || '');
  const [contact, setContact] = useState(currentUser?.telephone || '');
  const [prix, setPrix] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  // Client Order Modal State
  const [selectedOffer, setSelectedOffer] = useState<EmailProListing | null>(null);
  const [domaineDemande, setDomaineDemande] = useState('');
  const [contactClient, setContactClient] = useState(currentUser?.telephone || '');
  const [descriptionDemande, setDescriptionDemande] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const fetchEmailProData = async () => {
    try {
      setLoading(true);
      const [allListings, allOrders] = await Promise.all([
        getEmailProListings(),
        getEmailProOrders()
      ]);
      setListings(allListings);
      if (currentUser) {
        setMyOrders(
          allOrders.filter(
            o => o.clientUid === currentUser.uid || o.prestataireUid === currentUser.uid
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailProData();
    const handleUpdate = () => fetchEmailProData();
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, [currentUser?.uid]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigate('auth_login');
      return;
    }
    if (!contact.trim() || !prix || !description.trim()) {
      setPublishStatus("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    setPublishLoading(true);
    setPublishStatus(null);
    try {
      await addEmailProListing({
        prestataire: currentUser,
        contact: contact.trim(),
        prix: Number(prix),
        description: description.trim()
      });
      setPublishStatus("Votre tolotra Email Pro a été publié avec succès dans la boutique !");
      setDescription('');
      setTimeout(() => {
        setPublishStatus(null);
        setActiveTab('browse');
        fetchEmailProData();
      }, 1200);
    } catch (err) {
      setPublishStatus(err instanceof Error ? err.message : "Erreur lors de la publication.");
    } finally {
      setPublishLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigate('auth_login');
      return;
    }
    if (!selectedOffer) return;
    if (!domaineDemande.trim() || !contactClient.trim()) {
      setOrderStatus("Veuillez spécifier le domaine souhaité et votre numéro de contact.");
      return;
    }

    setOrderLoading(true);
    setOrderStatus(null);
    try {
      await createEmailProOrder({
        listing: selectedOffer,
        client: currentUser,
        domaineDemande: domaineDemande.trim(),
        contactClient: contactClient.trim(),
        description: descriptionDemande.trim()
      });
      setOrderStatus("Votre commande de service Email Pro a été transmise au prestataire !");
      setTimeout(() => {
        setOrderStatus(null);
        setSelectedOffer(null);
        setActiveTab('my_orders');
        fetchEmailProData();
      }, 1500);
    } catch (err) {
      setOrderStatus(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la commande.");
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tolotra Famoronana E-mail Professionnel</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Espace & Boutique Email Pro
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Trouvez un prestataire qualifié pour configurer vos adresses professionnelles personnalisées (ex: <code>contact@monentreprise.mg</code>) ou proposez vos services d'ingénierie messagerie.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'browse'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          Boutique des offres disponibles ({listings.length})
        </button>

        <button
          onClick={() => {
            if (!currentUser) onNavigate('auth_login');
            else setActiveTab('publish');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'publish'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Publier un service Email Pro</span>
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my_orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Mes commandes Email Pro ({myOrders.length})
          </button>
        )}
      </div>

      {/* TAB 1: BROWSE OFFERS */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Chargement des offres Email Pro...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Aucune offre de service Email Pro active</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Soyez le premier prestataire à proposer vos compétences en configuration d'e-mails d'entreprises.
              </p>
              <button
                onClick={() => setActiveTab('publish')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Proposer un service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((offer) => (
                <div
                  key={offer.listingId}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {offer.nomPrestataire.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{offer.nomPrestataire}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{offer.contact}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Email Pro
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tarif de la prestation</div>
                      <div className="text-xl font-black text-blue-600">
                        {offer.prix.toLocaleString('fr-FR')} <span className="text-xs font-bold">Ar</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {offer.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Configuration sous 24-48h</span>
                    <button
                      onClick={() => {
                        if (!currentUser) onNavigate('auth_login');
                        else setSelectedOffer(offer);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Commander</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLISH OFFER */}
      {activeTab === 'publish' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-black text-slate-900">Publier une Offre de Service Email Pro</h2>
            <p className="text-xs text-slate-500">
              Proposez vos services de création et paramétrage d'e-mails de domaine personnalisé aux entreprises.
            </p>
          </div>

          {publishStatus && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
              {publishStatus}
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom du prestataire ou de l'agence <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prestataireNom}
                onChange={(e) => setPrestataireNom(e.target.value)}
                placeholder="Ex: Rakoto Mamy (Consultant IT)"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro de téléphone / Contact public <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ex: +261 32 39 116 54"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prix du forfait en Ariary (Ar) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="5000"
                step="500"
                value={prix}
                onChange={(e) => setPrix(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 35000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description détaillée du service offert <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex : Création de 5 adresses e-mails professionnelles sur votre nom de domaine .mg ou .com avec paramétrage DNS complet (SPF, DKIM, DMARC), redirection et support de prise en main..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={publishLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {publishLoading ? 'Publication en cours...' : 'Publier mon offre Email Pro'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY ORDERS */}
      {activeTab === 'my_orders' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-black text-slate-900 pb-2 border-b border-slate-100">
            Suivi de vos commandes de services Email Pro
          </h2>

          {myOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune commande Email Pro pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{ord.reference}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {ord.statut}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">
                      Domaine demandé : <span className="text-blue-600 font-mono">{ord.domaineDemande}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Prestataire : {ord.nomPrestataire} | Client : {ord.clientNom} ({ord.contactClient})
                    </div>
                    {ord.description && (
                      <p className="text-[11px] text-slate-600 italic">Notes : {ord.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600">
                      {ord.prix.toLocaleString('fr-FR')} Ar
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      {new Date(ord.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDER POPUP MODAL */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Commander la création d'un Email Pro</h3>
              <button
                onClick={() => setSelectedOffer(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl text-xs space-y-1">
              <div>Prestataire : <strong>{selectedOffer.nomPrestataire}</strong></div>
              <div>Prix de la prestation : <strong>{selectedOffer.prix.toLocaleString('fr-FR')} Ar</strong></div>
            </div>

            {orderStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {orderStatus}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom de domaine souhaité <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={domaineDemande}
                    onChange={(e) => setDomaineDemande(e.target.value)}
                    placeholder="Ex : monentreprise.mg ou societe-mada.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Votre contact (Téléphone / WhatsApp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={contactClient}
                    onChange={(e) => setContactClient(e.target.value)}
                    placeholder="Ex : 032 39 116 54"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Précisions ou adresses souhaitées
                </label>
                <textarea
                  rows={2}
                  value={descriptionDemande}
                  onChange={(e) => setDescriptionDemande(e.target.value)}
                  placeholder="Ex : Je souhaite contact@ et direction@, j'ai déjà réservé le nom de domaine..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={orderLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {orderLoading ? 'Envoi...' : 'Envoyer la commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
