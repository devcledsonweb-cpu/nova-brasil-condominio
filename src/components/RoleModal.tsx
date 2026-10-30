import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  ShieldCheck,
  UserCheck,
  X,
  Building2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UserCog,
  Briefcase,
} from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose }) => {
  const { user, role, verifyAndSwitchRole } = useAuth();
  const [selectedRoleToSwitch, setSelectedRoleToSwitch] = useState<UserRole | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isOriginalAdmin = user?.originalRole === 'sindico' || user?.originalRole === 'admin';

  const handleSelectRole = async (targetRole: UserRole) => {
    setErrorMessage('');

    // Se já está na função
    if (role === targetRole) {
      onClose();
      return;
    }

    // Se está tentando mudar para Gestor Geral e NÃO é originariamente admin
    const isTargetAdmin = targetRole === 'sindico' || targetRole === 'admin';
    if (isTargetAdmin && !isOriginalAdmin) {
      setSelectedRoleToSwitch('sindico');
      setAdminPassword('');
      return;
    }

    // Se for admin ou mudando para cargo de menor privilégio
    setIsSubmitting(true);
    const result = await verifyAndSwitchRole(targetRole);
    setIsSubmitting(false);

    if (result.success) {
      setSelectedRoleToSwitch(null);
      setAdminPassword('');
      onClose();
    } else {
      setErrorMessage(result.message || 'Falha ao alterar perfil.');
    }
  };

  const handleConfirmAdminElevation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setErrorMessage('Por favor, informe a senha de administrador.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const result = await verifyAndSwitchRole('sindico', adminPassword.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSelectedRoleToSwitch(null);
      setAdminPassword('');
      onClose();
    } else {
      setErrorMessage(result.message || 'Senha incorreta.');
    }
  };

  const handleClose = () => {
    setSelectedRoleToSwitch(null);
    setAdminPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Nível de Acesso Operacional
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alternância segura de perfil com proteção por senha master
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informações da conta conectada */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.email}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {role === 'sindico' || role === 'admin'
                  ? 'Gestor da Empresa'
                  : role === 'supervisor'
                  ? 'Gestor do Condomínio'
                  : 'Agente de Portaria'}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.condoNames && user.condoNames.length > 0
                  ? user.condoNames.join(', ')
                  : user?.condoName || 'Acesso a Todos os Postos'}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Se o usuário precisa digitar a senha de administrador */}
        {selectedRoleToSwitch === 'sindico' ? (
          <form onSubmit={handleConfirmAdminElevation} className="p-5 space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Autenticação de Segurança Exigida</span>
              </div>
              <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                Você está autenticado originalmente como colaborador do posto. Para assumir a função de <strong>Gestor Geral da Empresa</strong> (com controle total de todos os condomínios e usuários), confirme a senha do administrador.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Senha Master do Administrador Geral *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite a senha master da empresa"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 pr-10 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleToSwitch(null);
                  setAdminPassword('');
                  setErrorMessage('');
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 min-h-[38px] shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSubmitting ? 'Verificando...' : 'Confirmar Elevação'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-3">
            {/* Perfil 1: Gestor Geral da Empresa */}
            <div
              onClick={() => handleSelectRole('sindico')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                role === 'sindico' || role === 'admin'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${role === 'sindico' || role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Gestor Geral da Empresa
                      {!isOriginalAdmin && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded font-medium flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Requer Senha
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                      Acesso Total a Todos os Condomínios & Usuários
                    </span>
                  </div>
                </div>
                {(role === 'sindico' || role === 'admin') && (
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">Ativo</span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Acesso irrestrito a todos os postos: cadastrar/excluir condomínios, gerenciar usuários e senhas, cadastrar agentes em múltiplos condomínios, viaturas e manutenções globais.
              </p>
            </div>

            {/* Perfil 2: Gestor do Condomínio / Supervisor Local */}
            <div
              onClick={() => handleSelectRole('supervisor')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                role === 'supervisor'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${role === 'supervisor' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Gestor de Condomínio (Supervisor de Posto)
                    </h4>
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                      Gestão Restrita aos Condomínios Cadastrados
                    </span>
                  </div>
                </div>
                {role === 'supervisor' && (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">Ativo</span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Supervisão total do(s) condomínio(s) a que foi atribuído: controle de escalas, aprovação de O.S., auditoria de rondas e conferência de equipamentos no posto. Não pode criar ou excluir condomínios da empresa.
              </p>
            </div>

            {/* Perfil 3: Agente de Portaria */}
            <div
              onClick={() => handleSelectRole('portaria')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                role === 'portaria' || role === 'operador'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${role === 'portaria' || role === 'operador' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Agente de Portaria (Operação)
                    </h4>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                      Acesso Restrito ao Posto e Escala
                    </span>
                  </div>
                </div>
                {(role === 'portaria' || role === 'operador') && (
                  <span className="text-[10px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-2 py-0.5 rounded">Ativo</span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Acesso do operador no posto: visualização de sua escala de trabalho, passagem de serviço no livro de ocorrências, abertura de ordens de serviço (reparos no posto) e checklist de materiais cautelados.
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-normal">
                <strong>Empresa Terceirizada NOVA BRASIL:</strong> Cada perfil possui isolamento de permissões. Agentes de portaria só visualizam informações dos condomínios em que foram alocados.
              </p>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[38px]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
