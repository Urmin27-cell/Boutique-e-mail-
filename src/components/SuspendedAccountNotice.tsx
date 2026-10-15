import React, { useState } from 'react';
import { AlertTriangle, Upload, CheckCircle, ShieldAlert, CreditCard } from 'lucide-react';
import { UserProfile } from '../types';
import { requestReactivation } from '../services/firebase';
import { WhatsAppButton } from './WhatsAppButton';
import { compressImageToBase64 } from '../lib/imageCompressor';

interface SuspendedAccountNoticeProps {
  currentUser: UserProfile;
  onRefreshUser: () => void;
}

export const SuspendedAccountNotice: React.FC<SuspendedAccountNoticeProps> = ({
  currentUser,
  onRefreshUser,
}) => {
  const [proofFileUrl, setProofFileUrl] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
      setErrorMsg("Format d'image non supporté (JPEG, PNG ou WebP requis).");
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
      setErrorMsg("Veuillez téléverser la preuve de transfert des 20 000 Ar.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await requestReactivation({
        user: currentUser,
        preuvePaiementUrl: proofFileUrl
      });
      setSuccessMsg("Votre demande de réactivation (20 000 Ar) a été soumise avec succès. L'administrateur va examiner votre dossier.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors de la transmission de la demande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-100 space-y-6">
        {/* Banner Alert */}
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-black text-sm sm:text-base text-red-950">
              Votre compte est actuellement SUSPENDU
            </h2>
            <p className="text-xs text-red-800 leading-relaxed">
              {currentUser.motifSuspension ||
                "Votre compte a été suspendu par mesure de sécurité suite à des signalements répétés ou 20 avis négatifs."}
            </p>
          </div>
        </div>

        {/* Instructions for reactivation */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm">
            Procédure Officielle de Réactivation du Compte
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pour demander la réactivation de votre compte et la restauration de vos annonces, vous devez vous acquitter des frais de réactivation fixés à <strong>20 000 Ariary</strong>.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-medium">Montant requis :</span>
              <span className="font-black text-sm text-red-600">20 000 Ariary (Ar)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Numéro de transfert Mobile Money :</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                0323911654
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Nom du titulaire :</span>
              <span className="font-bold text-slate-900">RAVELOMANANTSOA URMIN</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-emerald-900">Demande en cours d'examen</h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Preuve de transaction (Capture Mobile Money) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="reactProof"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="reactProof" className="cursor-pointer block space-y-1.5">
                  <Upload className="w-7 h-7 text-blue-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    {proofFileName ? proofFileName : 'Sélectionner la capture du transfert (JPEG, PNG, WebP)'}
                  </div>
                </label>
              </div>
            </div>

            {proofFileUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-36">
                <img src={proofFileUrl} alt="Reçu réactivation" className="w-full object-contain bg-slate-100" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !proofFileUrl}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Envoyer la demande de réactivation (20 000 Ar)</span>
              )}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Besoin d'assistance directe ou de contester ?</span>
          <WhatsAppButton variant="button" label="Assistance WhatsApp (+261 32 39 116 54)" className="text-xs py-2" />
        </div>
      </div>
    </div>
  );
};
