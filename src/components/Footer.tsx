import React from 'react';
import { Mail, Shield, Phone, FileText } from 'lucide-react';
import { WhatsAppButton } from './WhatsAppButton';

interface FooterProps {
  onOpenTerms: () => void;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Mail className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                BOUTIQUE <span className="text-blue-400">E-MAIL</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              La 1ère plateforme sécurisée à Madagascar pour l'achat, la vente d'adresses e-mails certifiées et les services d'adresses professionnelles sur mesure.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Paiements vérifiés & anti-double vente</span>
            </div>
          </div>

          {/* Col 2: Navigation rapide */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-400 font-bold text-white transition-colors">
                  Tableau de bord (Statistiques en temps réel)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-blue-400 transition-colors">
                  Boutique des E-mails
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('email_pro')} className="hover:text-blue-400 transition-colors">
                  Services Email Pro
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-blue-400 transition-colors">
                  Mettre un email en vente
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('history')} className="hover:text-blue-400 transition-colors">
                  Historique des ventes
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Transparence & Tarifs */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Tarifs & Règles</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Essai gratuit vendeur : <span className="text-emerald-400 font-semibold">3 jours offerts</span></li>
              <li>• Abonnement vendeur : <span className="text-blue-400 font-semibold">2 500 Ar / mois</span></li>
              <li>• Réactivation compte : <span className="text-amber-400 font-semibold">20 000 Ar</span></li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold underline mt-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Consulter les Conditions Générales</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Assistance & Support</h4>
            <p className="text-xs text-slate-400">
              Une question, un blocage ou un litige ? Notre équipe d'assistance est joignable 7j/7 :
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Numéro officiel : +261 32 39 116 54</span>
            </div>
            <div className="pt-1">
              <WhatsAppButton variant="button" label="Ouvrir WhatsApp" className="text-xs py-2 w-full" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} BOUTIQUE E-MAIL. Tous droits réservés. Conçu pour le marché malgache.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenTerms} className="hover:text-slate-400 underline">
              Conditions Générales & Règles
            </button>
            <span>•</span>
            <span>Confidentialité renforcée</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
