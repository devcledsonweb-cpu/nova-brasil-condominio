import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import {
  Condominium,
  SecurityAgent,
  PatrolVehicle,
  CompanyAsset,
  MaintenanceOrder,
  OperationalLog,
  ShiftCoverage,
  SystemUser,
} from '../types/index.ts';

export const COLLECTIONS = {
  CONDOMINIUMS: 'condominiums',
  AGENTS: 'securityAgents',
  VEHICLES: 'patrolVehicles',
  ASSETS: 'companyAssets',
  MAINTENANCES: 'maintenanceOrders',
  LOGS: 'operationalLogs',
  COVERAGES: 'shiftCoverages',
  USERS: 'appUsers',
} as const;

/**
 * Remove valores `undefined` que o Firestore rejeita.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      cleaned[key] = null;
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      cleaned[key] = cleanFirestoreData(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Escuta em tempo real uma coleção do Firestore.
 */
export function subscribeToFirestoreCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        const numericId = Number(docSnap.id);
        const resolvedId = isNaN(numericId) ? docSnap.id : numericId;
        return {
          ...data,
          id: data.id !== undefined ? data.id : resolvedId,
        } as T;
      });
      onUpdate(items);
    },
    (err) => {
      console.warn(`[Firestore] Erro ao sincronizar coleção "${collectionName}":`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Lê todos os documentos de uma coleção do Firestore diretamente.
 */
export async function getFirestoreCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as DocumentData;
      const numericId = Number(docSnap.id);
      const resolvedId = isNaN(numericId) ? docSnap.id : numericId;
      return {
        ...data,
        id: data.id !== undefined ? data.id : resolvedId,
      } as T;
    });
  } catch (err) {
    console.warn(`[Firestore] Erro ao ler coleção "${collectionName}":`, err);
    return [];
  }
}

/**
 * Cria ou substitui um documento no Firestore.
 */
export async function saveToFirestore<T extends { id?: string | number }>(
  collectionName: string,
  id: string | number,
  data: T
): Promise<void> {
  const clean = cleanFirestoreData({ ...data, id });
  const docRef = doc(db, collectionName, String(id));
  await setDoc(docRef, clean, { merge: true });
}

/**
 * Atualiza campos parciais de um documento no Firestore.
 */
export async function updateInFirestore(
  collectionName: string,
  id: string | number,
  patch: Record<string, any>
): Promise<void> {
  const clean = cleanFirestoreData(patch);
  const docRef = doc(db, collectionName, String(id));
  await updateDoc(docRef, clean);
}

/**
 * Remove um documento do Firestore.
 */
export async function deleteFromFirestore(
  collectionName: string,
  id: string | number
): Promise<void> {
  const docRef = doc(db, collectionName, String(id));
  await deleteDoc(docRef);
}

/**
 * Migra ou inicializa os dados padrão caso a coleção no Firestore esteja vazia.
 */
export async function seedIfEmpty<T extends { id: string | number }>(
  collectionName: string,
  defaultItems: T[]
): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && defaultItems.length > 0) {
      console.log(`[Firestore] Inicializando coleção "${collectionName}" com ${defaultItems.length} registros...`);
      for (const item of defaultItems) {
        await saveToFirestore(collectionName, item.id, item);
      }
    }
  } catch (err) {
    console.warn(`[Firestore] Aviso ao inicializar coleção "${collectionName}":`, err);
  }
}
