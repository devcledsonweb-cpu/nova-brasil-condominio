import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Link,
  X,
  Check,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  ZoomIn,
  Move,
  Maximize2,
  Sparkles,
  Info,
} from 'lucide-react';

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

  // Estado do Editor / Redimensionador e Compressor de Fotos
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sourceImageForEditing, setSourceImageForEditing] = useState<string>('');
  const [rawFileSizeKb, setRawFileSizeKb] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [quality, setQuality] = useState<number>(0.75); // 0.6 = leve, 0.75 = recomendado, 0.9 = alta
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Manipulador de upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }

    setRawFileSizeKb(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSourceImageForEditing(result);
        setZoom(1);
        setPanX(0);
        setPanY(0);
        setRotation(0);
        setIsEditorOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Permite selecionar o mesmo arquivo novamente
  };

  // Abrir editor para foto existente
  const openEditorForExisting = () => {
    if (!value) return;
    setSourceImageForEditing(value);
    setRawFileSizeKb(Math.round((value.length * 0.75) / 1024));
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setIsEditorOpen(true);
  };

  // Atualizar preview no canvas e estimar tamanho compactado
  useEffect(() => {
    if (!isEditorOpen || !sourceImageForEditing) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceImageForEditing;

    img.onload = () => {
      imageElementRef.current = img;
      renderCanvas();
    };
  }, [isEditorOpen, sourceImageForEditing, zoom, panX, panY, rotation, quality]);

  const renderCanvas = () => {
    const img = imageElementRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resoluções alvo conforme o tipo de foto
    const targetWidth = type === 'agent' ? 400 : 640;
    const targetHeight = type === 'agent' ? 400 : 400;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.save();

    // Centralizar no ponto de rotação
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calcular escala base para cobrir o canvas
    const scaleToFit = Math.max(targetWidth / img.width, targetHeight / img.height);
    const finalScale = scaleToFit * zoom;

    const drawWidth = img.width * finalScale;
    const drawHeight = img.height * finalScale;

    // Aplicar pan (deslocamento)
    const offsetX = panX * (targetWidth / 100);
    const offsetY = panY * (targetHeight / 100);

    ctx.drawImage(
      img,
      -drawWidth / 2 + offsetX,
      -drawHeight / 2 + offsetY,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Estimar tamanho compactado
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const estKb = Math.round((dataUrl.length * 0.75) / 1024);
      setCompressedSizeKb(estKb);
    } catch {
      // Ignora erro de cors caso a imagem externa não permita toDataURL
    }
  };

  const handleApplyCropAndCompression = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      if (sourceImageForEditing) onChange(sourceImageForEditing);
      setIsEditorOpen(false);
      return;
    }

    try {
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      onChange(compressedDataUrl);
      setIsEditorOpen(false);
    } catch (err) {
      console.warn('Fallback ao aplicar imagem:', err);
      if (sourceImageForEditing) onChange(sourceImageForEditing);
      setIsEditorOpen(false);
    }
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
            <div
              className={`relative overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs bg-slate-100 dark:bg-slate-800 ${
                type === 'agent' ? 'w-16 h-16 rounded-full' : 'w-20 h-16 rounded-xl'
              }`}
            >
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
            <div
              className={`border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 ${
                type === 'agent' ? 'w-16 h-16 rounded-full' : 'w-20 h-16 rounded-xl'
              }`}
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium">Sem foto</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {value && (
              <button
                type="button"
                onClick={openEditorForExisting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                title="Ajustar zoom, enquadramento e compactação"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Enquadrar & Comprimir</span>
              </button>
            )}

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
            {helperText || 'Redimensione e compacte para encaixe perfeito nos cards e listas operacionais.'}
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
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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

      {/* MODAL REDIMENSIONADOR & COMPACTADOR DE FOTOS */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Redimensionar & Posicionar Imagem
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ajuste o enquadramento e reduza o peso do arquivo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewport de Prévia / Crop Frame */}
            <div className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-full object-contain ${
                  type === 'agent' ? 'rounded-full' : 'rounded-lg'
                }`}
              />

              {/* Guia visual do enquadramento */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`border-2 border-white/60 shadow-2xl pointer-events-none ${
                    type === 'agent'
                      ? 'w-4/5 h-4/5 rounded-full ring-4 ring-black/40'
                      : 'w-[90%] h-[90%] rounded-xl ring-4 ring-black/40'
                  }`}
                />
              </div>

              {/* Badges de Comparação de Peso */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 bg-black/70 backdrop-blur-xs rounded-lg text-[10px] text-white">
                <span>
                  {rawFileSizeKb > 0 ? `Original: ${rawFileSizeKb} KB` : 'Foto Carregada'}
                </span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Compactado: ~{compressedSizeKb} KB
                </span>
              </div>
            </div>

            {/* Controles de Posição e Zoom */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              {/* Zoom Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Zoom / Escala:
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Posição Horizontal (Pan X) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-slate-500" />
                    Posição Horizontal (Eixo X):
                  </span>
                  <span className="font-mono text-slate-500">{panX > 0 ? `+${panX}%` : `${panX}%`}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={panX}
                  onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Posição Vertical (Pan Y) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-slate-500 rotate-90" />
                    Posição Vertical (Eixo Y):
                  </span>
                  <span className="font-mono text-slate-500">{panY > 0 ? `+${panY}%` : `${panY}%`}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={panY}
                  onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Rotação e Reset */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-semibold cursor-pointer text-[11px]"
                >
                  <RotateCw className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Girar 90° ({rotation}°)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPanX(0);
                    setPanY(0);
                    setRotation(0);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                >
                  Centralizar Padrão
                </button>
              </div>

              {/* Nível de Compactação */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qualidade da Compactação JPEG:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => setQuality(0.6)}
                    className={`px-2 py-1.5 rounded-lg font-semibold text-[10px] transition-colors cursor-pointer ${
                      quality === 0.6
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Super Leve (60%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality(0.75)}
                    className={`px-2 py-1.5 rounded-lg font-semibold text-[10px] transition-colors cursor-pointer ${
                      quality === 0.75
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Otimizado (75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality(0.9)}
                    className={`px-2 py-1.5 rounded-lg font-semibold text-[10px] transition-colors cursor-pointer ${
                      quality === 0.9
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Alta Definição (90%)
                  </button>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCropAndCompression}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Foto Otimizada</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
