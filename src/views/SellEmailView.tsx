import React, { useState } from 'react';
import {
  PlusCircle,
  Mail,
  Lock,
  DollarSign,
  User,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { UserProfile, EmailListing } from '../types';
import {
  addEmailListing,
  checkSellerSubscriptionStatus
} from '../services/firebase';

interface SellEmailViewProps {
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
  onOpenSubscriptionModal: () => void;
}

export const SellEmailView: React.FC<SellEmailViewProps> = ({
  currentUser,
  onNavigate,
  onOpenSubscriptionModal,
}) => {
  // Form fields
  const [adresseEmail, setAdresseEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [prix, setPrix] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [numeroPaiement, setNumeroPaiement] = useState(currentUser.telephone || '');
  const [nomTitulairePaiement, setNomTitulairePaiement] = useState(currentUser.nomComplet || '');
  const [nomVendeur, setNomVendeur] = useState(currentUser.nomComplet || '');
  const [telephoneVendeur, setTelephoneVendeur] = useState(currentUser.telephone || '');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check seller's 3-day trial or active subscription status
  const subStatus = checkSellerSubscriptionStatus(currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // If subscription is expired, block and prompt
    if (subStatus.isExpired) {
      setErrorMsg(subStatus.message);
      return;
    }

    if (!adresseEmail.trim() || !motDePasse || !prix || !numeroPaiement.trim() || !nomTitulairePaiement.trim()) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (Number(prix) <= 0) {
      setErrorMsg("Le prix de vente doit être strictement supérieur à zéro Ariary.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adresseEmail.trim())) {
      setErrorMsg("Format de l'adresse e-mail invalide.");
      return;
    }

    setLoading(true);

    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        nomComplet: nomVendeur.trim() || currentUser.nomComplet,
        telephone: telephoneVendeur.trim() || currentUser.telephone
      };

      await addEmailListing({
        adresseEmail: adresseEmail.trim(),
        motDePasse,
        prix: Number(prix),
        description: description.trim(),
        numeroPaiement: numeroPaiement.trim(),
        nomTitulairePaiement: nomTitulairePaiement.trim(),
        vendeur: updatedUser
      });

      setSuccessMsg("Votre e-mail a été mis en vente avec succès et figure désormais dans la boutique !");
      setAdresseEmail('');
      setMotDePasse('');
      setPrix('');
      setDescription('');

      setTimeout(() => {
        onNavigate('marketplace');
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue lors de la mise en vente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Mise en vente d'un compte e-mail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Ajouter un e-mail à vendre
          </h1>
          <p className="text-xs text-slate-500">
            Publiez votre annonce dans la boutique. Votre mot de passe reste strictement confidentiel et chiffré.
          </p>
        </div>

        {/* Subscription Status pill */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-right sm:text-right w-full sm:w-auto">
          <div className="text-[10px] uppercase font-bold text-slate-400">Statut Vendeur</div>
          <div className={`font-extrabold flex items-center gap-1 sm:justify-end ${subStatus.isExpired ? 'text-amber-600' : 'text-emerald-700'}`}>
            <Clock className={`w-3.5 h-3.5 ${subStatus.isExpired ? 'text-amber-500' : 'text-emerald-500'}`} />
            <span>{subStatus.message}</span>
          </div>
          {subStatus.isExpired && (
            <button
              onClick={onOpenSubscriptionModal}
              className="mt-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              Hanao abonnement (2 500 Ar)
            </button>
          )}
        </div>
      </div>

      {/* Trial Active Info Note (Shown during the 3 free days) */}
      {!subStatus.isExpired && subStatus.daysRemaining < 9000 && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Andrana maimaimpoana 3 andro :</strong> Afaka mampiditra sy mivarotra ny email-nao maimaimpoana ianao mandritra ny fe-potoana andrana.
            </span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg shrink-0">
            Mbola miasa
          </span>
        </div>
      )}

      {/* Expired notice banner: SHOWN ONLY AND STRICTLY IF THE 3-DAY TRIAL HAS ACTUALLY EXPIRED */}
      {subStatus.isExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2.5">
          <div className="font-bold flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tapitra ny fe-potoana andrana maimaimpoana 3 andro</span>
          </div>
          <p className="leading-relaxed text-slate-800 font-medium">
            Tapitra ny andrana maimaimpoana ho an'ny fampiasana plateforme. Raha tianao ho hita ao amin'ny liste ny email amidinao dia mila manao abonnement 2 500 Ar par mois ianao.
          </p>
          <button
            onClick={onOpenSubscriptionModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-colors"
          >
            Hanao abonnement izao (2 500 Ar)
          </button>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="leading-snug">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section A: Identifiants de l'email */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              A. Identifiants de l'E-mail à Vendre
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse e-mail à vendre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={adresseEmail}
                  onChange={(e) => setAdresseEmail(e.target.value)}
                  placeholder="Ex: contact.commerce@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Vérification automatique anti-doublon et anti-réutilisation d'adresse déjà vendue.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de passe de l'e-mail à vendre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Mot de passe confidentiel du compte"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-[10px] text-blue-800 mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Ce mot de passe est chiffré immédiatement. Il ne sera délivré qu'à l'acheteur légitime via le certificat PDF après confirmation de son paiement.
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Tarification & Description */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              B. Tarification et Caractéristiques
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prix en Ariary (Ar) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ex: 20000"
                  className="w-full pl-10 pr-14 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">Ariary</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description de l'e-mail
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex : Compte créé en 2021, propre, sans avertissement, parfait pour usage commercial ou professionnel..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Section C: Coordonnées de Paiement du Vendeur */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              C. Informations de Paiement (Où vous recevrez l'argent)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de compte / Mobile Money <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={numeroPaiement}
                    onChange={(e) => setNumeroPaiement(e.target.value)}
                    placeholder="Ex: 034 00 000 00 / MVola"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du titulaire du compte <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={nomTitulairePaiement}
                    onChange={(e) => setNomTitulairePaiement(e.target.value)}
                    placeholder="Ex: Ravelomanantsoa Urmin"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Coordonnées du Vendeur */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              D. Coordonnées de Contact du Vendeur
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet du vendeur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomVendeur}
                  onChange={(e) => setNomVendeur(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={telephoneVendeur}
                  onChange={(e) => setTelephoneVendeur(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Envoyer à la boutique</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
