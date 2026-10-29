import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<UserProfile>;
  setRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Armazena a sessão ativa do usuário no localStorage
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('novabrasil_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao restaurar sessão salva:', e);
    }
    return null;
  });

  const role: UserRole = user?.role || 'sindico';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      // Se não houver usuário local com senha, mas houver login Google
      if (fbUser && !user) {
        const googleProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || 'usuario@novabrasil.com',
          name: fbUser.displayName || 'Usuário Google',
          role: 'sindico',
        };
        setUser(googleProfile);
        localStorage.setItem('novabrasil_user', JSON.stringify(googleProfile));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Login com e-mail e senha no banco de dados com fallback resiliente para Vercel / offline
  const loginWithCredentials = async (email: string, password: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Tenta autenticar primeiro no backend / PostgreSQL se disponível
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data) {
          setUser(data);
          localStorage.setItem('novabrasil_user', JSON.stringify(data));
          return data;
        }

        // Se a API validou explicitamente e a senha está errada
        if (res.status === 401 && data?.error) {
          // Se for a conta master e a senha estiver errada, lança mensagem clara
          if (cleanEmail === 'administrativo@novabrasil.com' && cleanPassword !== '@nb32573515') {
            throw new Error('Senha incorreta para o administrador.');
          }
          throw new Error(data.error);
        }
      }
    } catch (apiErr: any) {
      // Se foi erro de credencial incorreta confirmado, repassa
      if (
        apiErr.message &&
        (apiErr.message.includes('incorret') ||
          apiErr.message.includes('não cadastrado') ||
          apiErr.message.includes('inativo'))
      ) {
        throw apiErr;
      }
      console.warn('Backend indisponível ou em hospedagem estática. Ativando autenticação direta.');
    }

    // 2. Autenticação Master Garantida (Acesso Total)
    if (cleanEmail === 'administrativo@novabrasil.com') {
      if (cleanPassword === '@nb32573515') {
        const masterUser: UserProfile = {
          id: 1,
          uid: 'admin-master',
          email: 'administrativo@novabrasil.com',
          name: 'Administrador Geral',
          role: 'sindico',
          permissions: '["all"]',
          condoId: null,
          isActive: true,
        };
        setUser(masterUser);
        localStorage.setItem('novabrasil_user', JSON.stringify(masterUser));
        return masterUser;
      } else {
        throw new Error('Senha incorreta para o e-mail administrativo@novabrasil.com');
      }
    }

    // 3. Acesso Portaria Garantido
    if (cleanEmail === 'portaria@novabrasil.com') {
      if (cleanPassword === 'portaria123' || cleanPassword === '@nb32573515') {
        const portariaUser: UserProfile = {
          id: 2,
          uid: 'user-portaria',
          email: 'portaria@novabrasil.com',
          name: 'Portaria Central',
          role: 'portaria',
          permissions: '["portaria"]',
          condoId: null,
          isActive: true,
        };
        setUser(portariaUser);
        localStorage.setItem('novabrasil_user', JSON.stringify(portariaUser));
        return portariaUser;
      } else {
        throw new Error('Senha incorreta para o e-mail portaria@novabrasil.com');
      }
    }

    // 4. Usuários criados dinamicamente no sistema pelo Administrador
    try {
      const localUsersStr = localStorage.getItem('novabrasil_users_list');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const match = localUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);
        if (match) {
          if (match.password === cleanPassword) {
            const userProfile: UserProfile = {
              id: match.id || Date.now(),
              uid: `local-${match.id || Date.now()}`,
              email: match.email,
              name: match.name,
              role: match.role || 'portaria',
              permissions: typeof match.permissions === 'string' ? match.permissions : JSON.stringify(match.permissions || []),
              condoId: match.condoId || null,
              isActive: true,
            };
            setUser(userProfile);
            localStorage.setItem('novabrasil_user', JSON.stringify(userProfile));
            return userProfile;
          } else {
            throw new Error('Senha incorreta.');
          }
        }
      }
    } catch (e: any) {
      if (e.message) throw e;
    }

    throw new Error('E-mail ou senha incorretos.');
  };

  const setRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('novabrasil_user', JSON.stringify(updated));
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        setFirebaseUser(result.user);
        const profile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email || 'usuario@novabrasil.com',
          name: result.user.displayName || 'Administrador Google',
          role: 'sindico',
        };
        setUser(profile);
        localStorage.setItem('novabrasil_user', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Falha ao autenticar com Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Erro ao deslogar firebase:', e);
    }
    setFirebaseUser(null);
    setUser(null);
    localStorage.removeItem('novabrasil_user');
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Role': user?.role || 'sindico',
      'X-User-Name': user?.name || 'Administrador',
      'X-User-Email': user?.email || '',
    };

    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.warn('Erro ao obter token do Firebase:', err);
      }
    }

    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        isAuthenticated: !!user,
        loading,
        loginWithCredentials,
        setRole,
        signInWithGoogle,
        signOut,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
