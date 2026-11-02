import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/whatsapp.ts';

interface WhatsAppButtonProps {
  phone?: string | null;
  name?: string | null;
  customMessage?: string;
  showText?: boolean;
  className?: string;
  badgeOnly?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  name,
  customMessage,
  showText = true,
  className = '',
  badgeOnly = false,
}) => {
  if (!phone) return null;

  const defaultMsg = customMessage || (name ? `Olá ${name}, contato operacional da NOVA BRASIL.` : 'Olá, contato operacional da NOVA BRASIL.');
  const url = getWhatsAppUrl(phone, defaultMsg);

  if (!url) {
    return (
      <span className={`text-slate-600 dark:text-slate-400 ${className}`}>
        {phone}
      </span>
    );
  }

  if (badgeOnly) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir conversa no WhatsApp com ${name || phone}`}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center p-1 rounded-md bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-2xs transition-transform hover:scale-110 cursor-pointer ${className}`}
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
      </a>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showText && (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {phone}
        </span>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Conversar no WhatsApp com ${name || phone}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs transition-all hover:scale-105 cursor-pointer shrink-0"
      >
        <MessageCircle className="w-3 h-3 fill-current" />
        <span>WhatsApp</span>
      </a>
    </div>
  );
};
