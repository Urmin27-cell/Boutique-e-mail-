import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  ShieldCheck,
  Star,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Lock,
  ArrowRight,
  Upload,
  AlertCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { EmailListing, UserProfile, Order } from '../types';
import {
  getEmailListings,
  createOrder,
  submitPaymentProof,
  rateSeller
} from '../services/firebase';
import { compressImageToBase64 } from '../lib/imageCompressor';
import confetti from 'canvas-confetti';

interface MarketplaceViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  onRefreshData?: () => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [listings, setListings] = useState<EmailListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(0);

  // Buy Modal State
  const [selectedListing, setSelectedListing] = useState<EmailListing | null>(null);
  const [orderStep, setOrderStep] = useState<'details' | 'payment' | 'completed'>('details');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [proofFileUrl, setProofFileUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Rating Modal State
  const [ratingTargetListing, setRatingTargetListing] = useState<EmailListing | null>(null);
  const [ratingStatus, setRatingStatus] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getEmailListings();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    const handleUpdate = () => fetchListings();
    window.addEventListener('boutique_email_data_updated', handleUpdate);
    return () => window.removeEventListener('boutique_email_data_updated', handleUpdate);
  }, []);

  // Filter listings: only show available ones
  const filteredListings = listings.filter((item) => {
    // Only available listings
    if (item.statutAnnonce !== 'disponible') return false;

    // Search query
    const query = search.toLowerCase();
    const matchSearch =
      item.adresseEmail.toLowerCase().includes(query) ||
      item.vendeurNom.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    if (!matchSearch) return false;

    // Provider filter
    if (filterProvider !== 'all') {
      if (!item.adresseEmail.toLowerCase().includes(filterProvider)) return false;
    }

    // Max Price
    if (filterMaxPrice > 0 && item.prix > filterMaxPrice) return false;

    return true;
  });

  const handleOpenBuyModal = (listing: EmailListing) => {
    if (!currentUser) {
      alert("Mila miditra ao amin'ny kaontinao (Connexion) ianao vao afaka mividy e-mail. Hampidirinao amin'ny pejy fidirana izao.");
      onNavigate('auth_login');
      return;
    }
    if (listing.vendeurUid === currentUser.uid) {
      alert("Tsy afaka mividy ny e-mail anao ianao.");
      return;
    }
    setSelectedListing(listing);
    setOrderStep('details');
    setCreatedOrder(null);
    setProofFileUrl('');
    setProofFileName('');
    setOrderError(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedListing || !currentUser) return;
    setOrderLoading(true);
    setOrderError(null);
    try {
      const order = await createOrder(selectedListing.listingId, currentUser);
      setCreatedOrder(order);
      setOrderStep('payment');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Erreur lors de la réservation de l'e-mail.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
      setOrderError("Format de fichier non supporté. Veuillez joindre une image JPEG, PNG ou WebP.");
      return;
    }

    setProofFileName(file.name);
    try {
      // Compress to lightweight base64 for direct Firestore storage
      const base64 = await compressImageToBase64(file, 1200, 0.75);
      setProofFileUrl(base64);
      setOrderError(null);
    } catch {
      setOrderError("Erreur lors de la compression de l'image.");
    }
  };

  const handleSendPaymentProof = async () => {
    if (!createdOrder || !proofFileUrl) {
      setOrderError("Veuillez sélectionner votre fichier de preuve de paiement.");
      return;
    }
    setOrderLoading(true);
    setOrderError(null);
    try {
      await submitPaymentProof(createdOrder.orderId, proofFileUrl);
      setOrderStep('completed');
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Erreur lors de la validation du reçu.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleRate = async (typeNote: 'positive' | 'negative') => {
    if (!currentUser) {
      onNavigate('auth_login');
      return;
    }
    if (!ratingTargetListing) return;
    try {
      await rateSeller({
        vendeurUid: ratingTargetListing.vendeurUid,
        auteurUid: currentUser.uid,
        auteurNom: currentUser.nomComplet,
        typeNote
      });
      setRatingStatus(`Note ${typeNote === 'positive' ? 'positive (+1)' : 'négative (-1)'} enregistrée !`);
      setTimeout(() => {
        setRatingTargetListing(null);
        setRatingStatus(null);
        fetchListings();
      }, 1000);
    } catch (err) {
      setRatingStatus(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la note.");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catalogue Officiel</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Boutique des Comptes E-mails
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Parcourez les adresses disponibles, consultez la réputation des vendeurs et sécurisez votre achat avec délivrance du certificat officiel d'accès en PDF.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par adresse, vendeur ou mot-clé..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">Tous les services</option>
            <option value="gmail.com">Gmail (@gmail.com)</option>
            <option value="outlook.com">Outlook (@outlook.com)</option>
            <option value="yahoo.com">Yahoo (@yahoo.com)</option>
          </select>

          <select
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="0">Tous les prix</option>
            <option value="15000">Jusqu'à 15 000 Ar</option>
            <option value="25000">Jusqu'à 25 000 Ar</option>
            <option value="50000">Jusqu'à 50 000 Ar</option>
          </select>

          <div className="text-xs text-slate-500 font-medium px-2 ml-auto">
            <span className="font-bold text-slate-900">{filteredListings.length}</span> email(s) disponible(s)
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Chargement des e-mails disponibles...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Aucun e-mail disponible</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aucune annonce active ne correspond à vos critères de recherche pour le moment.
          </p>
          {currentUser && (
            <button
              onClick={() => onNavigate('sell')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
            >
              Mettre le premier email en vente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.listingId}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header: Seller & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {listing.vendeurNom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {listing.vendeurNom}
                        </span>
                        {listing.badgeBleuVendeur && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200"
                            title="Vendeur Vérifié (Badge Bleu : 20+ avis positifs)"
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>Vérifié</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                          +{listing.notesPositives || 0}
                        </span>
                        <span>•</span>
                        <span className="text-red-500 font-semibold flex items-center gap-0.5">
                          -{listing.notesNegatives || 0}
                        </span>
                        <button
                          onClick={() => setRatingTargetListing(listing)}
                          className="text-blue-600 hover:underline font-medium ml-1 cursor-pointer"
                        >
                          Noter cette personne
                        </button>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Disponible
                  </span>
                </div>

                {/* Email Display */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Adresse e-mail à vendre
                  </div>
                  <div className="font-bold text-sm text-slate-900 font-mono tracking-tight break-all">
                    {listing.adresseEmail}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Lock className="w-3 h-3 text-blue-500" />
                    <span>Mot de passe chiffré (délivré via PDF après validation)</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {listing.description || "Aucune description complémentaire."}
                </p>
              </div>

              {/* Bottom: Price & CTA */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Prix d'acquisition</span>
                  <span className="text-lg font-black text-blue-600">
                    {listing.prix.toLocaleString('fr-FR')} <span className="text-xs font-bold">Ar</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBuyModal(listing);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer relative z-20"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Acheter</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUY MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Acheter cet e-mail</h3>
                  <p className="text-[11px] text-slate-500">Transaction sécurisée en Ariary</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕ Fermer
              </button>
            </div>

            {orderError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-snug">{orderError}</div>
              </div>
            )}

            {/* Step 1: Purchase Details & Reservation */}
            {orderStep === 'details' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Adresse e-mail :</span>
                    <span className="font-bold text-slate-900">{selectedListing.adresseEmail}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Vendeur :</span>
                    <span className="font-bold text-slate-900">{selectedListing.vendeurNom}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Numéro de compte destinataire :</span>
                    <span className="font-mono font-bold text-blue-600">{selectedListing.numeroPaiement}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Nom du titulaire :</span>
                    <span className="font-bold text-slate-900">{selectedListing.nomTitulairePaiement}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Total à payer :</span>
                    <span className="text-lg font-black text-blue-600">
                      {selectedListing.prix.toLocaleString('fr-FR')} Ariary
                    </span>
                  </div>
                </div>

                {/* Auto-trigger reservation logic */}
                {React.useEffect(() => {
                  if (orderStep === 'details' && selectedListing && !createdOrder && !orderLoading) {
                    handleConfirmPurchase();
                  }
                }, [orderStep])}

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 flex items-center justify-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Réservation automatique en cours...
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Payment & Proof Submission */}
            {orderStep === 'payment' && createdOrder && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>E-mail réservé avec succès ! Référence : {createdOrder.reference}</span>
                  </div>
                  <p className="text-emerald-900 text-[11px]">
                    Veuillez transférer exactement <strong>{createdOrder.prix.toLocaleString('fr-FR')} Ar</strong> sur le compte :
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono font-bold text-slate-900">
                    Numéro : <span className="text-blue-600">{createdOrder.numeroPaiement}</span> ({createdOrder.nomTitulairePaiement})
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Preuve de paiement (Capture ou Reçu SMS / Mobile Money) <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      id="proofFile"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="proofFile" className="cursor-pointer block space-y-2">
                      <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                      <div className="text-xs font-bold text-slate-700">
                        {proofFileName ? proofFileName : 'Cliquez pour sélectionner la preuve (JPEG, PNG, WebP)'}
                      </div>
                      <p className="text-[10px] text-slate-400">Taille maximum : 8 Mo</p>
                    </label>
                  </div>
                </div>

                {proofFileUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-40">
                    <img src={proofFileUrl} alt="Aperçu du reçu" className="w-full object-contain bg-slate-100" />
                  </div>
                )}

                <button
                  onClick={handleSendPaymentProof}
                  disabled={orderLoading || !proofFileUrl}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {orderLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Envoyer la commande pour vérification</span>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Completed Notice */}
            {orderStep === 'completed' && createdOrder && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Commande transmise avec succès !</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Votre preuve a été transmise au vendeur pour confirmation des fonds. Dès validation, vous pourrez télécharger votre Certificat PDF avec mot de passe dans l'espace <strong>« Mes achats »</strong>.
                </p>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedListing(null);
                      onNavigate('purchases');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                  >
                    Aller dans « Mes achats »
                  </button>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingTargetListing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Évaluer ce vendeur</h3>
              <button
                onClick={() => setRatingTargetListing(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="font-bold text-xs text-slate-900">{ratingTargetListing.vendeurNom}</div>
              <p className="text-[11px] text-slate-500">
                Votre avis permet de récompenser les vendeurs sérieux (Badge Bleu) et de suspendre les comptes douteux.
              </p>
            </div>

            {ratingStatus && (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs text-center font-medium">
                {ratingStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRate('positive')}
                className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex flex-col items-center gap-1.5 transition-all hover:scale-105"
              >
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
                <span>Note positive (+1)</span>
              </button>

              <button
                onClick={() => handleRate('negative')}
                className="py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex flex-col items-center gap-1.5 transition-all hover:scale-105"
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
