import React, { useState } from 'react';
import { Clock, Upload, CheckCircle, AlertCircle, X, CreditCard, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { requestSubscription } from '../services/firebase';
import { compressImageToBase64 } from '../lib/imageCompressor';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [proofFileUrl, setProofFileUrl] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
      setErrorMsg("Veuillez sélectionner une image valide (JPEG, PNG ou WebP).");
      return;
    }

    setProofFileName(file.name);
    try {
      const base64 = await compressImageToBase64(file, 1200, 0.75);
      setProofFileUrl(base64);
      setErrorMsg(null);
    } catch {
      setErrorMsg("Erreur lors de la compression de l'image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFileUrl) {
      setErrorMsg("Veuillez joindre la preuve de transfert de 2 500 Ar.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await requestSubscription({
        user: currentUser,
        preuvePaiementUrl: proofFileUrl
      });
      setStatusMsg("Votre demande d'abonnement a été transmise avec succès ! L'administrateur va valider votre reçu pour activer vos 30 jours.");
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors de la soumission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Abonnement Vendeur (30 Jours)
              </h3>
              <p className="text-[11px] text-slate-500">BOUTIQUE E-MAIL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg ? (
          <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-2 border border-emerald-200">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-emerald-900">Demande enregistrée</h4>
            <p className="text-[11px] text-emerald-800 leading-snug">{statusMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Details as specifically instructed */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-blue-200/60">
                <span className="text-blue-900 font-medium">Montant de l'abonnement :</span>
                <span className="font-black text-sm text-blue-700">2 500 Ariary / mois</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Numéro de paiement :</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  0323911654
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Nom du titulaire :</span>
                <span className="font-bold text-slate-900">RAVELOMANANTSOA URMIN</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Effectuez un transfert de 2 500 Ar vers le numéro ci-dessus, puis joignez la capture du reçu de transfert.
            </p>

            {/* Proof Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Preuve de transaction <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="subProofFile"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="subProofFile" className="cursor-pointer block space-y-1.5">
                  <Upload className="w-7 h-7 text-blue-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    {proofFileName ? proofFileName : 'Sélectionner la capture (JPEG, PNG, WebP)'}
                  </div>
                </label>
              </div>
            </div>

            {proofFileUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-32">
                <img src={proofFileUrl} alt="Aperçu du reçu" className="w-full object-contain bg-slate-100" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !proofFileUrl}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Envoyer la demande d'abonnement</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
