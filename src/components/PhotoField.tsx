import React, { useState } from 'react';
import { Camera, Upload, Link, X, Check, Image as ImageIcon } from 'lucide-react';

interface PhotoFieldProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  type: 'condo' | 'agent' | 'vehicle' | 'asset';
  helperText?: string;
}

const PRESETS: Record<PhotoFieldProps['type'], { title: string; url: string }[]> = {
  condo: [
    {
      title: 'Residencial Jardins Moderno',
      url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Condomínio Clube Contemporâneo',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Edifício Comercial & Corporate',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Portaria & Guarita Blindada',
      url: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=600&q=80',
    },
  ],
  agent: [
    {
      title: 'Agente Masculino 1',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Agente Masculino 2',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Agente Feminina 1',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Agente Masculino 3',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    },
  ],
  vehicle: [
    {
      title: 'Moto Honda CG Ronda Noturna',
      url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Viatura Branca Operacional',
      url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Moto Yamaha Patrulha',
      url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Carro Compacto de Ronda',
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    },
  ],
  asset: [
    {
      title: 'Rádio Comunicador HT',
      url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Bastão de Vigia / Ronda',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Maleta de Ferramentas Técnicas',
      url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Equipamento de Proteção / EPI',
      url: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=400&q=80',
    },
  ],
};

export const PhotoField: React.FC<PhotoFieldProps> = ({
  label,
  value,
  onChange,
  type,
  helperText,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            Remover Foto
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Preview Thumbnail */}
        <div className="relative group shrink-0">
          {value ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs bg-slate-100 dark:bg-slate-800">
              <img
                src={value}
                alt="Foto"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium">Sem foto</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setShowPresets(!showPresets);
                setShowUrlInput(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Fotos Prontas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUrlInput(!showUrlInput);
                setShowPresets(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Link URL</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {helperText || 'Foto visível para todos os operadores e supervisores no painel.'}
          </p>
        </div>
      </div>

      {/* Manual URL Input */}
      {showUrlInput && (
        <form onSubmit={handleApplyManualUrl} className="flex gap-2 pt-1 animate-in fade-in">
          <input
            type="url"
            placeholder="Cole o link da imagem (ex: https://...)"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Aplicar
          </button>
        </form>
      )}

      {/* Preset Photo Grid */}
      {showPresets && (
        <div className="pt-2 animate-in fade-in">
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Selecione uma foto profissional do acervo:
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS[type].map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChange(preset.url);
                  setShowPresets(false);
                }}
                className={`group relative rounded-lg overflow-hidden border cursor-pointer aspect-square ${
                  value === preset.url
                    ? 'border-blue-600 ring-2 ring-blue-500/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
                title={preset.title}
              >
                <img
                  src={preset.url}
                  alt={preset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                  <p className="text-[9px] text-white font-medium truncate text-center">
                    {preset.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
