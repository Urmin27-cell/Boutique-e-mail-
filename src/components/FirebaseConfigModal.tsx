import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { getActiveFirebaseConfig, saveActiveFirebaseConfig, isConfiguredWithCloud } from '../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentCfg = getActiveFirebaseConfig();
  const [configJson, setConfigJson] = useState(
    JSON.stringify(
      {
        apiKey: currentCfg.apiKey || '',
        authDomain: currentCfg.authDomain || '',
        projectId: currentCfg.projectId || '',
        storageBucket: currentCfg.storageBucket || '',
        messagingSenderId: currentCfg.messagingSenderId || '',
        appId: currentCfg.appId || '',
        firestoreDatabaseId: currentCfg.firestoreDatabaseId || '(default)'
      },
      null,
      2
    )
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(configJson);
      if (!parsed.apiKey || !parsed.projectId) {
        setErrorMsg("La configuration doit contenir au minimum 'apiKey' et 'projectId'.");
        return;
      }
      saveActiveFirebaseConfig(parsed);
      setSuccessMsg("Configuration Firebase enregistrée ! Rechargement...");
    } catch {
      setErrorMsg("Format JSON invalide. Veuillez vérifier la syntaxe.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Configuration Firebase (Auth & Firestore)
              </h3>
              <p className="text-[11px] text-slate-500">
                {isConfiguredWithCloud ? 'Connecté à Firebase Cloud' : 'Moteur Firestore & Auth Actif'}
              </p>
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

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-3 bg-blue-50/70 rounded-2xl text-xs text-blue-900 leading-relaxed border border-blue-100">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Authentification & Firestore + Base64</span>
          </div>
          <p className="text-[11px]">
            Conformément à votre demande, seules les ressources <strong>Firebase Authentication</strong> et <strong>Cloud Firestore</strong> sont sollicitées. Toutes les images (preuves de virement, reçus) sont compressées et stockées directement en <strong>base64</strong> dans les documents Firestore.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Objet de configuration Firebase SDK Web (JSON)
            </label>
            <textarea
              rows={8}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Enregistrer & Connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
