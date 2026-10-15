import React from 'react';
import { X, ShieldAlert, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Conditions Générales d'Utilisation</h3>
              <p className="text-xs text-slate-500">Transparence, Sécurité et Règles de la plateforme BOUTIQUE E-MAIL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              1. Objet de la plateforme
            </h4>
            <p className="text-xs text-slate-600">
              BOUTIQUE E-MAIL est un intermédiaire technique permettant la mise en relation entre vendeurs et acheteurs de comptes de messagerie électronique (Gmail, Outlook, Yahoo, etc.) ainsi que la souscription à des prestations de création d'adresses e-mails professionnelles sur mesure à Madagascar.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              2. Règles de vente & Anti-Double Vente
            </h4>
            <p className="text-xs text-slate-600">
              • Tout utilisateur mettant un e-mail en vente garantit sur l'honneur être le propriétaire légitime du compte et s'engage à en céder l'accès exclusif et définitif à l'acheteur après validation.<br/>
              • La plateforme intègre un système strict d'intégrité : un e-mail déjà vendu ou en cours de commande active ne peut sous aucun prétexte être remis en vente.<br/>
              • Le mot de passe du compte à vendre est chiffré et stocké de manière isolée. Il n'est jamais divulgué publiquement.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              3. Essai Gratuit et Abonnement Vendeur
            </h4>
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
              <p><strong>• Essai gratuit :</strong> Chaque nouveau vendeur bénéficie d'une période d'essai de <strong>3 jours gratuits</strong> pour publier ses annonces.</p>
              <p><strong>• Abonnement mensuel :</strong> À l'issue des 3 jours, pour maintenir la visibilité de ses annonces dans la boutique, le vendeur s'acquitte d'un forfait de <strong>2 500 Ariary par mois (30 jours)</strong>.</p>
              <p><strong>• Modalités de paiement :</strong> Le règlement se fait par transfert Mobile Money vers le <strong>032 39 116 54</strong> (RAVELOMANANTSOA URMIN). Une preuve de transaction est requise et doit être validée par l'administrateur.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              4. Paiements, Preuves et Réservations
            </h4>
            <p className="text-xs text-slate-600">
              • Lors du clic sur « Confirmer l'achat », l'annonce est temporairement réservée pour empêcher les collisions d'achats simultanés.<br/>
              • L'acheteur doit effectuer le paiement directement sur le compte indiqué par le vendeur et téléverser une image authentique de preuve de paiement.<br/>
              • <strong>Avertissement important :</strong> L'envoi d'une preuve de transaction ne constitue pas une validation automatique. Les fonds doivent être effectivement vérifiés et confirmés par le vendeur ou l'administrateur avant la délivrance du compte.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              5. Délivrance Sécurisée du Mot de Passe via PDF
            </h4>
            <p className="text-xs text-slate-600">
              • Une fois le paiement confirmé, l'accès au mot de passe est débloqué exclusivement pour l'acheteur dans son espace privé « Mes achats ».<br/>
              • La délivrance s'effectue au moyen d'un <strong>Certificat Officiel PDF</strong> téléchargeable, généré côté serveur/application, contenant les identifiants et les consignes impératives de sécurité.<br/>
              • Dès réception, l'acheteur a l'obligation de modifier immédiatement le mot de passe et d'associer son propre numéro de récupération.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              6. Système de Notation, Badge Bleu et Suspension
            </h4>
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <p><strong>• Système d'évaluation :</strong> Les acheteurs peuvent attribuer une « Note positive » ou une « Note négative » à la suite d'une transaction.</p>
              <p><strong>• Badge Bleu Vérifié :</strong> Tout vendeur totalisant <strong>20 notes positives</strong> obtient automatiquement le Badge Bleu officiel affiché sur son profil et ses annonces.</p>
              <p><strong>• Suspension automatique :</strong> Tout vendeur recevant <strong>20 notes négatives</strong> voit son compte suspendu sur-le-champ pour protéger la communauté, et ses annonces sont retirées de la vente.</p>
              <p><strong>• Frais de Réactivation :</strong> La réactivation d'un compte suspendu requiert le paiement de <strong>20 000 Ariary</strong> au <strong>032 39 116 54</strong>, soumis à la vérification et à la décision de l'administrateur.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              7. Litiges et Absence de Fausses Garanties
            </h4>
            <p className="text-xs text-slate-600">
              La plateforme met en œuvre les meilleurs moyens de sécurité (chiffrement, traçabilité des commandes, vérification manuelle, logs d'audit). Toutefois, la responsabilité des informations transmises incombe aux parties contractantes. En cas de litige, l'assistance officielle WhatsApp au <strong>+261 32 39 116 54</strong> est habilitée à arbitrer les contestations et à suspendre les comptes malveillants.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            J'ai compris et j'accepte
          </button>
        </div>
      </div>
    </div>
  );
};
