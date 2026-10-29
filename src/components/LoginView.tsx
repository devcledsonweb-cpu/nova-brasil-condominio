import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, signInWithGoogle } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await loginWithCredentials(cleanEmail, cleanPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors relative">
      {/* Botão de Modo Noturno no topo direito */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Ativar modo claro' : 'Ativar modo noturno'}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md mb-1 font-bold text-lg">
            NB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            NOVA BRASIL
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sistema Operacional de Facilities, Portaria & Segurança Condominial
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6 transition-colors">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Identificação de Acesso</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite suas credenciais corporativas para acessar o painel
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="seu.email@novabrasil.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Sua senha de acesso"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
            >
              {loading ? (
                <span>Verificando credenciais...</span>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Opção secundária: Conta Google */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar com Conta Google</span>
            </button>
          </div>
        </div>

        {/* Informação sobre Níveis de Acesso */}
        <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p>Ambiente seguro e restrito à equipe de gestão e portaria.</p>
          <p>Moradores não têm acesso a este painel administrativo.</p>
        </div>
      </div>
    </div>
  );
};
