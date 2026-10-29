import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import { ShieldCheck, UserCheck, X, Building2 } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose }) => {
  const { role, setRole } = useAuth();

  if (!isOpen) return null;

  const handleSelectRole = (newRole: UserRole) => {
    setRole(newRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Perfil de Acesso na Empresa</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Selecione o perfil operacional para navegar na plataforma</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Opção 1: Gestor da Empresa */}
          <div
            onClick={() => handleSelectRole('sindico')}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              role === 'sindico' || role === 'admin'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-md ${role === 'sindico' || role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Gestor Geral da Empresa</h4>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Controle Total</span>
                </div>
              </div>
              {(role === 'sindico' || role === 'admin') && (
                <span className="text-xs bg-blue-600 text-white font-medium px-2 py-0.5 rounded">Ativo</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Gestão executiva da empresa: cadastro de condomínios atendidos, alocação de agentes de portaria, gestão de viaturas e motos de ronda, controle de patrimônio/materiais e abertura de ordens de manutenção predial.
            </p>
          </div>

          {/* Opção 2: Supervisor / Operação */}
          <div
            onClick={() => handleSelectRole('portaria')}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              role === 'portaria' || role === 'operador'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-md ${role === 'portaria' || role === 'operador' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Supervisor / Posto de Portaria</h4>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Operação Diária</span>
                </div>
              </div>
              {(role === 'portaria' || role === 'operador') && (
                <span className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium px-2 py-0.5 rounded">Ativo</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Foco na operação do posto: registro de passagem de serviço entre turnos, relatórios de rondas preventivas e conferência dos materiais da empresa cautelados no condomínio.
            </p>
          </div>

          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-lg flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-normal">
              <strong>Atenção:</strong> Este sistema pertence e é operado exclusivamente pela empresa terceirizada. Não há acesso para síndicos ou moradores.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
