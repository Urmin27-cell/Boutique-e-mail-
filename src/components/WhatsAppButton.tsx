import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  variant?: 'floating' | 'button';
  label?: string;
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  variant = 'floating',
  label = 'Support WhatsApp (+261 32 39 116 54)',
  className = '',
}) => {
  const phoneNumber = '261323911654';
  const message = encodeURIComponent("Bonjour, j'ai besoin d'aide concernant la plateforme BOUTIQUE E-MAIL.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  if (variant === 'button') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <MessageCircle className="w-5 h-5" />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <aside aria-label="Support client" className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 group border-2 border-white ${className}`}
        title="Contacter le support WhatsApp"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
        </div>
        <span className="font-bold text-sm hidden sm:inline-block pr-1">
          Support WhatsApp
        </span>
      </a>
    </aside>
  );
};
