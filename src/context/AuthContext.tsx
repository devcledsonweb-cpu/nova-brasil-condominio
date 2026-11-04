import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<UserProfile>;
  setRole: (role: UserRole) => void;
  verifyAndSwitchRole: (targetRole: UserRole, adminPassword?: string) => Promise<{ success: boolean; message?: string }>;
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
        const parsed = JSON.parse(saved);
        if (!parsed.originalRole) {
          parsed.originalRole = parsed.role || 'sindico';
        }
        return parsed;
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
      // Se não houver usuário local com senha, restaura a partir do Firebase Auth
      if (fbUser && !user) {
        const isGoogleProvider = fbUser.providerData.some((p) => p.providerId === 'google.com');

        if (isGoogleProvider) {
          const googleProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'usuario@novabrasil.com',
            name: fbUser.displayName || 'Administrador (Google)',
            role: 'sindico',
            originalRole: 'sindico',
          };
          setUser(googleProfile);
          localStorage.setItem('novabrasil_user', JSON.stringify(googleProfile));
        } else if (fbUser.email) {
          // É conta de e-mail e senha no Firebase Auth (ex: agente cadastrado)
          // Busca o perfil correspondente no Firestore para nunca exibir "Usuário Google"
          const cleanEmail = fbUser.email.toLowerCase().trim();
          let profileFound: UserProfile | null = null;

          try {
            const usersSnap = await getDocs(collection(db, 'appUsers'));
            const uMatch = usersSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as any)
              .find((u) => u.email && u.email.toLowerCase() === cleanEmail);

            if (uMatch) {
              const assignedIds = Array.isArray(uMatch.condoIds) && uMatch.condoIds.length > 0
                ? uMatch.condoIds
                : (uMatch.condoId ? [uMatch.condoId] : []);
              const assignedNames = Array.isArray(uMatch.condoNames) && uMatch.condoNames.length > 0
                ? uMatch.condoNames
                : (uMatch.condoName ? [uMatch.condoName] : []);

              profileFound = {
                id: uMatch.id || Date.now(),
                uid: fbUser.uid,
                email: uMatch.email,
                name: uMatch.name || fbUser.displayName || 'Agente Operacional',
                role: uMatch.role || 'portaria',
                originalRole: uMatch.role || 'portaria',
                permissions: typeof uMatch.permissions === 'string' ? uMatch.permissions : JSON.stringify(uMatch.permissions || []),
                condoId: assignedIds[0] || uMatch.condoId || null,
                condoIds: assignedIds,
                condoName: assignedNames[0] || uMatch.condoName || undefined,
                condoNames: assignedNames,
                isActive: uMatch.isActive !== false,
              };
            }
          } catch {}

          if (!profileFound) {
            try {
              const agentsSnap = await getDocs(collection(db, 'securityAgents'));
              const agMatch = agentsSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as any)
                .find((ag) => (ag.accessEmail && ag.accessEmail.toLowerCase() === cleanEmail) || (ag.email && ag.email.toLowerCase() === cleanEmail));

              if (agMatch) {
                const assignedIds = Array.isArray(agMatch.condoIds) && agMatch.condoIds.length > 0
                  ? agMatch.condoIds
                  : (agMatch.condoId ? [Number(agMatch.condoId)] : []);
                const assignedNames = agMatch.condoNames || (agMatch.condoName ? [agMatch.condoName] : []);

                profileFound = {
                  id: agMatch.id || Date.now(),
                  uid: fbUser.uid,
                  email: cleanEmail,
                  name: agMatch.name || 'Agente de Portaria',
                  role: 'portaria',
                  originalRole: 'portaria',
                  permissions: JSON.stringify(['portaria', 'ronda', 'materiais', 'ocorrencias']),
                  condoId: assignedIds[0] || null,
                  condoIds: assignedIds,
                  condoName: assignedNames[0] || undefined,
                  condoNames: assignedNames,
                  isActive: agMatch.status !== 'afastado',
                };
              }
            } catch {}
          }

          if (profileFound) {
            setUser(profileFound);
            localStorage.setItem('novabrasil_user', JSON.stringify(profileFound));
          } else if (cleanEmail.includes('admin') || cleanEmail.includes('cledson')) {
            const adminProfile: UserProfile = {
              uid: fbUser.uid,
              email: cleanEmail,
              name: fbUser.displayName || 'Administrador Geral',
              role: 'sindico',
              originalRole: 'sindico',
            };
            setUser(adminProfile);
            localStorage.setItem('novabrasil_user', JSON.stringify(adminProfile));
          } else {
            const agentProfile: UserProfile = {
              uid: fbUser.uid,
              email: cleanEmail,
              name: fbUser.displayName || cleanEmail.split('@')[0],
              role: 'portaria',
              originalRole: 'portaria',
            };
            setUser(agentProfile);
            localStorage.setItem('novabrasil_user', JSON.stringify(agentProfile));
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Registra ou autentica automaticamente a conta no Firebase Authentication para aparecer no console do Firebase
  const syncSessionToFirebaseAuth = async (email: string, pass: string, displayName?: string) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      if (displayName && userCred.user && !userCred.user.displayName) {
        import('firebase/auth').then(({ updateProfile }) => {
          updateProfile(userCred.user, { displayName }).catch(() => {});
        });
      }
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, pass);
          if (displayName && userCred.user) {
            import('firebase/auth').then(({ updateProfile }) => {
              updateProfile(userCred.user, { displayName }).catch(() => {});
            });
          }
        } catch (cErr) {
          console.warn('Registro no Firebase Auth:', cErr);
        }
      }
    }
  };

  // Login com e-mail e senha no banco de dados com fallback resiliente para Vercel / offline
  const loginWithCredentials = async (email: string, password: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Autenticação Master Garantida (Acesso Total da Gestão Nova Brasil)
    if (cleanEmail === 'administrativo@novabrasil.com' || cleanEmail === 'cledson@novabrasil.com') {
      const isCledson = cleanEmail === 'cledson@novabrasil.com';
      const isPasswordValid = isCledson
        ? (cleanPassword === '123456' || cleanPassword === '@nb32573515')
        : cleanPassword === '@nb32573515';

      if (isPasswordValid) {
        const masterUser: UserProfile = {
          id: isCledson ? 7 : 1,
          uid: isCledson ? 'usr-cledson-admin' : 'admin-master',
          email: cleanEmail,
          name: isCledson ? 'CLEDSON DA SILVA SALES' : 'Administrador Geral',
          role: 'sindico',
          originalRole: 'sindico',
          permissions: '["all"]',
          condoId: null,
          condoIds: [],
          condoNames: ['Todos os Condomínios'],
          isActive: true,
        };
        setUser(masterUser);
        localStorage.setItem('novabrasil_user', JSON.stringify(masterUser));
        syncSessionToFirebaseAuth(cleanEmail, cleanPassword, masterUser.name).catch(() => {});
        return masterUser;
      } else {
        throw new Error(`Senha incorreta para o e-mail ${cleanEmail}`);
      }
    }

    // 2. Acesso Portaria Geral Garantido
    if (cleanEmail === 'portaria@novabrasil.com') {
      if (cleanPassword === 'portaria123' || cleanPassword === '@nb32573515') {
        const portariaUser: UserProfile = {
          id: 2,
          uid: 'user-portaria',
          email: 'portaria@novabrasil.com',
          name: 'Portaria Central',
          role: 'portaria',
          originalRole: 'portaria',
          permissions: '["portaria","ronda","materiais","ocorrencias"]',
          condoId: null,
          condoIds: [],
          condoNames: ['Posto Central'],
          isActive: true,
        };
        setUser(portariaUser);
        localStorage.setItem('novabrasil_user', JSON.stringify(portariaUser));
        syncSessionToFirebaseAuth(cleanEmail, cleanPassword, portariaUser.name).catch(() => {});
        return portariaUser;
      } else {
        throw new Error('Senha incorreta para o e-mail portaria@novabrasil.com');
      }
    }

    // 3. Verificar usuários no Firestore (appUsers) - Fonte prioritária de credenciais
    try {
      const snap = await getDocs(collection(db, 'appUsers'));
      const firestoreUsers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const match = firestoreUsers.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
      if (match) {
        const isPasswordCorrect =
          match.password === cleanPassword ||
          cleanPassword === '@nb32573515' ||
          (match.role === 'portaria' && cleanPassword === 'Portaria@123');

        if (isPasswordCorrect) {
          const assignedIds: number[] = Array.isArray(match.condoIds) && match.condoIds.length > 0
            ? match.condoIds
            : (match.condoId ? [match.condoId] : []);
          const assignedNames: string[] = Array.isArray(match.condoNames) && match.condoNames.length > 0
            ? match.condoNames
            : (match.condoName ? [match.condoName] : []);

          const userProfile: UserProfile = {
            id: match.id || Date.now(),
            uid: `firestore-${match.id}`,
            email: match.email,
            name: match.name,
            role: match.role || 'portaria',
            originalRole: match.role || 'portaria',
            permissions: typeof match.permissions === 'string' ? match.permissions : JSON.stringify(match.permissions || []),
            condoId: assignedIds[0] || match.condoId || null,
            condoIds: assignedIds,
            condoName: assignedNames[0] || match.condoName || undefined,
            condoNames: assignedNames,
            isActive: match.isActive !== false,
          };
          setUser(userProfile);
          localStorage.setItem('novabrasil_user', JSON.stringify(userProfile));
          syncSessionToFirebaseAuth(cleanEmail, cleanPassword, userProfile.name).catch(() => {});
          return userProfile;
        } else {
          throw new Error('Senha incorreta.');
        }
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('Senha incorreta') || e.message.includes('inativo'))) {
        throw e;
      }
    }

    // 4. Verificar agentes no Firestore (securityAgents)
    try {
      const agSnap = await getDocs(collection(db, 'securityAgents'));
      const agents = agSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const agMatch = agents.find((ag: any) =>
        (ag.accessEmail && ag.accessEmail.toLowerCase() === cleanEmail) ||
        (ag.email && ag.email.toLowerCase() === cleanEmail)
      );

      if (agMatch) {
        const isPasswordCorrect =
          agMatch.accessPassword === cleanPassword ||
          agMatch.password === cleanPassword ||
          cleanPassword === 'Portaria@123' ||
          cleanPassword === '@nb32573515';

        if (isPasswordCorrect) {
          const assignedIds: number[] = Array.isArray(agMatch.condoIds) && agMatch.condoIds.length > 0
            ? agMatch.condoIds
            : (agMatch.condoId ? [Number(agMatch.condoId)] : []);
          const assignedNames: string[] = Array.isArray(agMatch.condoNames) && agMatch.condoNames.length > 0
            ? agMatch.condoNames
            : (agMatch.condoName ? [agMatch.condoName] : []);

          const userProfile: UserProfile = {
            id: agMatch.id || Date.now(),
            uid: `agent-${agMatch.id}`,
            email: cleanEmail,
            name: agMatch.name,
            role: 'portaria',
            originalRole: 'portaria',
            permissions: JSON.stringify(['portaria', 'ronda', 'materiais', 'ocorrencias']),
            condoId: assignedIds[0] || null,
            condoIds: assignedIds,
            condoName: assignedNames[0] || undefined,
            condoNames: assignedNames,
            isActive: agMatch.status !== 'afastado',
          };
          setUser(userProfile);
          localStorage.setItem('novabrasil_user', JSON.stringify(userProfile));
          syncSessionToFirebaseAuth(cleanEmail, cleanPassword, userProfile.name).catch(() => {});
          return userProfile;
        } else {
          throw new Error('Senha incorreta.');
        }
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('Senha incorreta') || e.message.includes('inativo'))) {
        throw e;
      }
    }

    // 5. Usuários criados localmente no sistema
    try {
      const localUsersStr = localStorage.getItem('novabrasil_users_list');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const match = localUsers.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
        if (match) {
          if (match.password === cleanPassword || cleanPassword === '@nb32573515') {
            const assignedIds: number[] = Array.isArray(match.condoIds) && match.condoIds.length > 0
              ? match.condoIds
              : (match.condoId ? [match.condoId] : []);
            const assignedNames: string[] = Array.isArray(match.condoNames) && match.condoNames.length > 0
              ? match.condoNames
              : (match.condoName ? [match.condoName] : []);

            const userProfile: UserProfile = {
              id: match.id || Date.now(),
              uid: `local-${match.id || Date.now()}`,
              email: match.email,
              name: match.name,
              role: match.role || 'portaria',
              originalRole: match.role || 'portaria',
              permissions: typeof match.permissions === 'string' ? match.permissions : JSON.stringify(match.permissions || []),
              condoId: match.condoId || null,
              condoIds: assignedIds,
              condoName: match.condoName || undefined,
              condoNames: assignedNames,
              isActive: true,
            };
            setUser(userProfile);
            localStorage.setItem('novabrasil_user', JSON.stringify(userProfile));
            syncSessionToFirebaseAuth(cleanEmail, cleanPassword, userProfile.name).catch(() => {});
            return userProfile;
          } else {
            throw new Error('Senha incorreta.');
          }
        }
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('Senha incorreta') || e.message.includes('inativo'))) {
        throw e;
      }
    }

    // 6. Tenta autenticar no backend / PostgreSQL se nenhuma regra anterior atendeu
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
          const profileWithOriginal: UserProfile = {
            ...data,
            originalRole: data.originalRole || data.role || 'portaria',
            condoIds: Array.isArray(data.condoIds) && data.condoIds.length > 0
              ? data.condoIds
              : (data.condoId ? [data.condoId] : []),
            condoNames: data.condoNames || (data.condoName ? [data.condoName] : []),
          };
          setUser(profileWithOriginal);
          localStorage.setItem('novabrasil_user', JSON.stringify(profileWithOriginal));
          syncSessionToFirebaseAuth(cleanEmail, cleanPassword, profileWithOriginal.name).catch(() => {});
          return profileWithOriginal;
        }
      }
    } catch {
      // Ignora falha de backend
    }

    throw new Error('E-mail ou senha incorretos.');
  };

  const setRole = (newRole: UserRole) => {
    if (!user) return;
    const isTargetManager = newRole === 'sindico' || newRole === 'admin' || newRole === 'supervisor';
    const isCurrentAgent = role === 'portaria' || role === 'operador';
    if (isCurrentAgent && isTargetManager) {
      console.warn('Bloqueio de segurança: troca de Agente para Gestor requer autenticação com senha master.');
      return;
    }
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('novabrasil_user', JSON.stringify(updated));
  };

  const verifyAndSwitchRole = async (targetRole: UserRole, adminPassword?: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'Nenhum usuário conectado.' };
    }

    const isTargetManager = targetRole === 'sindico' || targetRole === 'admin' || targetRole === 'supervisor';
    const isCurrentAgent = role === 'portaria' || role === 'operador' || user.role === 'portaria';

    // Sempre que estiver como agente e tentar mudar para Gestor (Empresa ou Condomínio), exige senha
    if (isCurrentAgent && isTargetManager) {
      const cleanPass = adminPassword ? adminPassword.trim() : '';
      if (!cleanPass) {
        return {
          success: false,
          message: 'É obrigatório informar a senha de Gestor para alterar o perfil de acesso.',
        };
      }

      // Validações aceitas: senha master (@nb32573515) ou senha de admin cadastrado
      let isValidPass = cleanPass === '@nb32573515';
      if (!isValidPass) {
        try {
          const localUsersStr = localStorage.getItem('novabrasil_users_list');
          if (localUsersStr) {
            const list = JSON.parse(localUsersStr);
            isValidPass = list.some((u: any) => (u.role === 'sindico' || u.role === 'admin') && u.password === cleanPass);
          }
        } catch {
          // ignore
        }
      }

      if (!isValidPass) {
        return {
          success: false,
          message: 'Senha de Gestor incorreta. Apenas gestores com a senha de controle podem assumir este nível.',
        };
      }
    }

    const updated: UserProfile = {
      ...user,
      role: targetRole,
    };
    setUser(updated);
    localStorage.setItem('novabrasil_user', JSON.stringify(updated));
    return { success: true };
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
        verifyAndSwitchRole,
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
