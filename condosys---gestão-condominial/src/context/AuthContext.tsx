import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  role: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('novabrasil_role') || localStorage.getItem('condosys_role');
    return (saved === 'portaria' || saved === 'sindico') ? saved : 'sindico';
  });
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserProfile>({
    uid: 'admin-sindico',
    email: 'sindico@novabrasil.com.br',
    name: 'Síndico Geral (Gestão)',
    role: 'sindico',
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('novabrasil_role', newRole);
    setUser((prev) => ({
      ...prev,
      role: newRole,
      name: newRole === 'sindico' ? (firebaseUser?.displayName || 'Síndico Geral (Gestão)') : 'Portaria Operacional (Turno A)',
      email: newRole === 'sindico' ? (firebaseUser?.email || 'sindico@novabrasil.com.br') : 'portaria@novabrasil.com.br',
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || 'usuario@novabrasil.com.br',
          name: fbUser.displayName || (role === 'sindico' ? 'Síndico Geral' : 'Operador da Portaria'),
          role,
        });
      } else {
        setUser({
          uid: `demo-${role}`,
          email: role === 'sindico' ? 'sindico@novabrasil.com.br' : 'portaria@novabrasil.com.br',
          name: role === 'sindico' ? 'Síndico Geral (Gestão)' : 'Portaria Operacional (Turno A)',
          role,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        setFirebaseUser(result.user);
      }
    } catch (error) {
      console.error('Falha ao autenticar com Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Falha ao deslogar:', error);
    }
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Role': role,
      'X-User-Name': user.name,
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
        loading,
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
