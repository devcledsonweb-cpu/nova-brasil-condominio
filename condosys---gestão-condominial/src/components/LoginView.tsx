import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  LogIn,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('administrativo@novabrasil.com');
  const [password, setPassword] = useState('@nb32573515');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithCredentials(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-sm mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NOVA BRASIL
          </h1>
          <p className="text-xs text-slate-500">
            Sistema Integrado de Gestão Condominial
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Identificação de Acesso</h2>
            <p className="text-xs text-slate-500">
              Digite seu e-mail e senha para acessar o painel administrativo
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="exemplo@novabrasil.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Atalho com as Credenciais Principais Solicitadas */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Preenchimento Rápido de Acesso:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillCredentials('administrativo@novabrasil.com', '@nb32573515')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                  <span>Acesso Master</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  administrativo@novabrasil.com
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleFillCredentials('portaria@novabrasil.com', '@nb32573515')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  <span>Acesso Portaria</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  portaria@novabrasil.com
                </p>
              </button>
            </div>
          </div>

          {/* Opção secundária: Google Login */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar com Conta Google</span>
            </button>
          </div>
        </div>

        {/* Informação sobre Níveis de Acesso */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>Acesso restrito para a administração e operadores da portaria.</p>
          <p>Novos acessos são criados e delegados pelo Administrador Geral.</p>
        </div>
      </div>
    </div>
  );
};
