import React from 'react';
import {
  Mail,
  ShieldCheck,
  ShoppingBag,
  PlusCircle,
  Briefcase,
  CheckCircle,
  ArrowRight,
  FileText,
  Lock,
  Sparkles,
  Users,
  Activity
} from 'lucide-react';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenTerms: () => void;
  isAuthenticated: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenTerms,
  isAuthenticated,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 pt-12 pb-20 border-b border-blue-100/60">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Plateforme Officielle d'Adresses E-mails & Email Pro à Madagascar</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Achetez et Vendez vos <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Comptes E-mails en Toute Sécurité
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              La place de marché numéro 1 conçue pour protéger acheteurs et vendeurs : déblocage d'accès certifié par PDF, garantie anti-double vente, évaluation par badges et création d'e-mails professionnels.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Tableau de bord (En direct)</span>
              </button>

              <button
                onClick={() => onNavigate('marketplace')}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Découvrir la boutique</span>
              </button>

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => onNavigate('auth_signup')}
                    className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Créer un compte</span>
                  </button>

                  <button
                    onClick={() => onNavigate('auth_login')}
                    className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
                  >
                    Se connecter
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('sell')}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Vendre un email (3j d'essai)</span>
                </button>
              )}

              <WhatsAppButton variant="button" label="Support WhatsApp (+261 32 39 116 54)" />
            </div>

            {/* Trust points */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Preuves vérifiées manuellement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Mots de passe chiffrés & isolés</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Certificat PDF officiel délivré</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars / Comment ça marche */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comment fonctionne BOUTIQUE E-MAIL ?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Un processus transparent, équitable et sécurisé pour toutes les transactions en Ariary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Comment vendre */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pour les Vendeurs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mettez en vente vos adresses e-mails inutilisées ou d'ancienneté (Gmail, Outlook, Yahoo).
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span><strong>Essai gratuit de 3 jours</strong> offert dès votre inscription.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Mot de passe chiffré et strictement protégé.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Vous recevez les paiements directement sur votre compte.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Abonnement de 2 500 Ar / mois après la fin des 3 jours d'essai.</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('sell')}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Déposer une annonce</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Comment acheter */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pour les Acheteurs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trouvez l'adresse e-mail idéale pour vos besoins professionnels ou personnels.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <span>Consultation des annonces et des notes du vendeur (Badge bleu).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <span>Réservation instantanée de l'e-mail pour éviter les doublons.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <span>Transmission de votre preuve de paiement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <span><strong>Téléchargement du Certificat PDF officiel</strong> avec mot de passe.</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('marketplace')}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Voir les e-mails disponibles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Service Email Pro */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Service Email Pro</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Faites configurer vos adresses professionnelles personnalisées à votre nom de domaine.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span>Exemples : <code>contact@entreprise.mg</code>, <code>direction@cabinet.com</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span>Paramétrage DNS complet (SPF, DKIM, DMARC) pour zéro spam.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span>Prestations assurées par des experts qualifiés.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span>Devis et commande simplifiés en ligne.</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('email_pro')}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Découvrir l'Espace Email Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Safety Features */}
      <section className="bg-slate-900 text-white rounded-3xl max-w-7xl mx-auto px-6 py-12 sm:px-12 sm:py-16 shadow-xl">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Sécurité & Fiabilité Maximale
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Pourquoi faire confiance à BOUTIQUE E-MAIL ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Une architecture conçue pour éliminer les arnaques et garantir l'exclusivité de vos comptes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
            <h4 className="font-bold text-sm text-white">Garantie Anti-Double Vente</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dès qu'un e-mail est acheté ou validé, notre système le verrouille définitivement et empêche sa remise en vente.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <Lock className="w-8 h-8 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">Chiffrement des Mots de Passe</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Les mots de passe des adresses à vendre sont chiffrés et invisibles du public ou des moteurs de recherche.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <Users className="w-8 h-8 text-amber-400" />
            <h4 className="font-bold text-sm text-white">Notes & Badge Bleu</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Les vendeurs fiables obtiennent le Badge Bleu (20 avis positifs). Les fraudeurs sont suspendus dès 20 avis négatifs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <FileText className="w-8 h-8 text-indigo-400" />
            <h4 className="font-bold text-sm text-white">Certificat PDF Officiel</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chaque achat réussi génère un certificat d'accès PDF nominatif avec vos identifiants et les consignes de sécurité.
            </p>
          </div>
        </div>

        {/* Support Banner inside card */}
        <div className="mt-10 p-6 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-sm text-white">Besoin d'un accompagnement personnalisé ?</h4>
            <p className="text-xs text-slate-300">Notre support d'experts est à votre écoute sur WhatsApp au +261 32 39 116 54.</p>
          </div>
          <WhatsAppButton variant="button" className="text-xs" />
        </div>
      </section>
    </div>
  );
};
