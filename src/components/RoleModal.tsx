import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import { ShieldCheck, UserCheck, X, ShieldAlert, Building2 } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose }) => {
  const { role, setRole, user } = useAuth();

  if (!isOpen) return null;

  const handleSelectRole = (newRole: UserRole) => {
    setRole(newRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Perfil de Acesso na Empresa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Selecione o perfil operacional para navegar na plataforma</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-md ${role === 'sindico' || role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Gestor Geral da Empresa</h4>
                  <span className="text-xs text-blue-700 font-medium">Controle Total</span>
                </div>
              </div>
              {(role === 'sindico' || role === 'admin') && (
                <span className="text-xs bg-blue-600 text-white font-medium px-2 py-0.5 rounded">Ativo</span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
              Gestão executiva da empresa: cadastro de condomínios atendidos, alocação de agentes de portaria, gestão de viaturas e motos de ronda, controle de patrimônio/materiais e abertura de ordens de manutenção predial.
            </p>
          </div>

          {/* Opção 2: Supervisor / Operação */}
          <div
            onClick={() => handleSelectRole('portaria')}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              role === 'portaria' || role === 'operador'
                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-md ${role === 'portaria' || role === 'operador' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Supervisor / Posto de Portaria</h4>
                  <span className="text-xs text-slate-700 font-medium">Operação Diária</span>
                </div>
              </div>
              {(role === 'portaria' || role === 'operador') && (
                <span className="text-xs bg-slate-900 text-white font-medium px-2 py-0.5 rounded">Ativo</span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
              Foco na operação do posto: registro de passagem de serviço entre turnos, relatórios de rondas preventivas e conferência dos materiais da empresa cautelados no condomínio.
            </p>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-900 leading-normal">
              <strong>Atenção:</strong> Este sistema pertence e é operado exclusivamente pela empresa terceirizada. Não há acesso para síndicos ou moradores.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
