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

  // Login com e-mail e senha no banco de dados relacional
  const loginWithCredentials = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Falha ao autenticar.');
    }

    const authenticatedUser: UserProfile = await res.json();
    setUser(authenticatedUser);
    localStorage.setItem('novabrasil_user', JSON.stringify(authenticatedUser));
    return authenticatedUser;
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
