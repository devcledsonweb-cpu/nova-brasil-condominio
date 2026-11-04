import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Registra ou atualiza automaticamente o agente/usuário no Firebase Authentication
 * utilizando uma instância secundária para NÃO derrubar a sessão ativa do Administrador.
 */
export async function registerOrSyncUserInFirebaseAuth(
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; isNew?: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanEmail.includes('@') || cleanPassword.length < 6) {
    return { success: false, message: 'E-mail inválido ou senha com menos de 6 caracteres.' };
  }

  try {
    const secondaryAppName = 'NovaBrasilSecondaryAuthManager';
    const existingApp = getApps().find((a) => a.name === secondaryAppName);
    const secondaryApp = existingApp || initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Tenta criar a conta no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        cleanPassword
      );

      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: displayName.trim() }).catch(() => {});
      }

      // Desconecta da instância secundária para não reter estado
      await secondaryAuth.signOut().catch(() => {});
      console.log(`✓ Conta criada automaticamente no Firebase Auth: ${cleanEmail} (${displayName || 'Agente'})`);
      return { success: true, isNew: true };
    } catch (createErr: any) {
      // Se a conta já existe no Firebase Auth, tenta autenticar e atualizar o displayName se necessário
      if (createErr.code === 'auth/email-already-in-use') {
        try {
          const loginCred = await signInWithEmailAndPassword(
            secondaryAuth,
            cleanEmail,
            cleanPassword
          );
          if (displayName && loginCred.user && loginCred.user.displayName !== displayName.trim()) {
            await updateProfile(loginCred.user, { displayName: displayName.trim() }).catch(() => {});
          }
          await secondaryAuth.signOut().catch(() => {});
          return { success: true, isNew: false };
        } catch {
          // Se falhou o login (ex: senha diferente), apenas ignora pois a conta já está no Firebase Auth
          return { success: true, isNew: false };
        }
      }
      console.warn('Aviso no Firebase Auth create:', createErr.message || createErr.code);
      return { success: false, message: createErr.message };
    }
  } catch (err: any) {
    console.warn('Erro ao registrar no Firebase Auth:', err);
    return { success: false, message: err?.message };
  }
}
