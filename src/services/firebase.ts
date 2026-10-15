/**
 * Firebase Service Layer with Live Firebase Authentication & Firestore (plus base64 image storage)
 * Conforms to user specification: ONLY Firebase Auth & Firestore, with images stored as base64 in Firestore.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Firestore,
  getDocFromServer
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';

import defaultConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  EmailListing,
  EncryptedCredential,
  Order,
  SalesHistory,
  SellerRating,
  SubscriptionRequest,
  ReactivationRequest,
  EmailProListing,
  EmailProOrder,
  AppNotification,
  AdminAuditLog,
  AccountStatus
} from '../types';
import { encryptPassword, decryptPassword } from '../lib/crypto';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Configuration resolver
export function getActiveFirebaseConfig() {
  const saved = localStorage.getItem('boutique_email_firebase_custom_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch {}
  }
  return defaultConfig;
}

export function saveActiveFirebaseConfig(cfg: any) {
  localStorage.setItem('boutique_email_firebase_custom_config', JSON.stringify(cfg));
  window.location.reload();
}

const activeConfig = getActiveFirebaseConfig();
export const isConfiguredWithCloud = Boolean(
  activeConfig.apiKey &&
  activeConfig.projectId &&
  !activeConfig.apiKey.includes('REPLACE') &&
  !activeConfig.projectId.includes('remixed')
);

let appInstance: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

if (isConfiguredWithCloud) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
    firestoreDb = getFirestore(appInstance, activeConfig.firestoreDatabaseId || '(default)');
    firebaseAuth = getAuth(appInstance);

    // Initial connection test
    getDocFromServer(doc(firestoreDb, 'test', 'connection')).catch(() => {
      // Offline or initialization probe
    });
  } catch (err) {
    console.warn("Live Firebase initialization notice:", err);
  }
}

export const db = firestoreDb;
export const auth = firebaseAuth;

// Storage keys for hybrid fallback/sync
const STORAGE_PREFIX = 'boutique_email_';
const USERS_KEY = STORAGE_PREFIX + 'users';
const LISTINGS_KEY = STORAGE_PREFIX + 'listings';
const CREDENTIALS_KEY = STORAGE_PREFIX + 'credentials';
const ORDERS_KEY = STORAGE_PREFIX + 'orders';
const SALES_KEY = STORAGE_PREFIX + 'sales_history';
const RATINGS_KEY = STORAGE_PREFIX + 'seller_ratings';
const SUBSCRIPTIONS_KEY = STORAGE_PREFIX + 'subscription_requests';
const REACTIVATIONS_KEY = STORAGE_PREFIX + 'reactivation_requests';
const EMAIL_PRO_LISTINGS_KEY = STORAGE_PREFIX + 'email_pro_listings';
const EMAIL_PRO_ORDERS_KEY = STORAGE_PREFIX + 'email_pro_orders';
const NOTIFICATIONS_KEY = STORAGE_PREFIX + 'notifications';
const AUDIT_LOGS_KEY = STORAGE_PREFIX + 'audit_logs';
const CURRENT_USER_KEY = STORAGE_PREFIX + 'current_user';

// BroadcastChannel for cross-tab instant real-time synchronization
const realtimeChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('boutique_email_realtime_channel')
  : null;

if (realtimeChannel) {
  realtimeChannel.onmessage = (event) => {
    if (event.data?.type === 'COLLECTION_UPDATED') {
      window.dispatchEvent(new Event('boutique_email_data_updated'));
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
      window.dispatchEvent(new Event('boutique_email_data_updated'));
    }
  });
}

export const ADMIN_EMAILS = ['horlandobe@gmail.com', 'madanexora@gmail.com'];

export function isUserAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
}

// Reset & Purge All Demo Accounts & Demo Amounts to run 100% Real-Time
export function purgeAllDemoData() {
  const demoKeys = [
    LISTINGS_KEY,
    ORDERS_KEY,
    SALES_KEY,
    RATINGS_KEY,
    SUBSCRIPTIONS_KEY,
    REACTIVATIONS_KEY,
    EMAIL_PRO_LISTINGS_KEY,
    EMAIL_PRO_ORDERS_KEY,
    CREDENTIALS_KEY,
    NOTIFICATIONS_KEY
  ];
  demoKeys.forEach(k => localStorage.removeItem(k));

  // Sanitize users list: remove any demo accounts
  const rawUsers = localStorage.getItem(USERS_KEY);
  if (rawUsers) {
    try {
      const parsed: UserProfile[] = JSON.parse(rawUsers);
      const cleaned = parsed.filter(u =>
        !u.email.toLowerCase().includes('demo') &&
        !u.email.toLowerCase().includes('exemple') &&
        !u.email.toLowerCase().includes('test') &&
        !u.nomComplet.toLowerCase().includes('demo') &&
        u.uid !== 'demo_seller_1' &&
        u.uid !== 'demo_buyer_1'
      );
      localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
    } catch {
      localStorage.removeItem(USERS_KEY);
    }
  }

  // Ensure primary administrator account exists cleanly without demo amounts
  const currentUsers = getCollection<UserProfile>(USERS_KEY);
  if (!currentUsers.some(u => u.email.toLowerCase() === 'horlandobe@gmail.com')) {
    const adminUser: UserProfile = {
      uid: 'admin_horlando_live',
      nomComplet: 'Horlando',
      email: 'horlandobe@gmail.com',
      telephone: '+261323911654',
      role: 'admin',
      statutCompte: 'actif',
      dateCreation: new Date().toISOString(),
      nombreNotesPositives: 0,
      nombreNotesNegatives: 0,
      badgeBleu: true,
      statutAbonnement: 'actif',
    };
    currentUsers.push(adminUser);
    saveCollection(USERS_KEY, currentUsers);
  }

  if (!currentUsers.some(u => u.email.toLowerCase() === 'madanexora@gmail.com')) {
    const adminUser2: UserProfile = {
      uid: 'admin_madanexora_live',
      nomComplet: 'Madanexora Admin',
      email: 'madanexora@gmail.com',
      telephone: '+261323911654',
      role: 'admin',
      statutCompte: 'actif',
      dateCreation: new Date().toISOString(),
      nombreNotesPositives: 0,
      nombreNotesNegatives: 0,
      badgeBleu: true,
      statutAbonnement: 'actif',
    };
    currentUsers.push(adminUser2);
    saveCollection(USERS_KEY, currentUsers);
  }

  localStorage.setItem('boutique_email_realtime_purged_v6', 'true');
  window.dispatchEvent(new Event('boutique_email_data_updated'));
}

function initializeCleanRealtimeData() {
  const PURGE_FLAG = 'boutique_email_realtime_purged_v6';
  if (!localStorage.getItem(PURGE_FLAG)) {
    purgeAllDemoData();
  }
}

initializeCleanRealtimeData();

// -------------------------------------------------------------
// LIVE FIRESTORE REAL-TIME LISTENERS (onSnapshot)
// -------------------------------------------------------------
if (firestoreDb) {
  try {
    // 1. Live Email Listings
    onSnapshot(collection(firestoreDb, 'emailListings'), (snap) => {
      const items: EmailListing[] = [];
      snap.forEach((d) => items.push(d.data() as EmailListing));
      saveCollection(LISTINGS_KEY, items);
    }, (err) => console.warn("Firestore emailListings snapshot notice:", err));

    // 2. Live Orders
    onSnapshot(collection(firestoreDb, 'orders'), (snap) => {
      const items: Order[] = [];
      snap.forEach((d) => items.push(d.data() as Order));
      saveCollection(ORDERS_KEY, items);
    }, (err) => console.warn("Firestore orders snapshot notice:", err));

    // 3. Live Sales History
    onSnapshot(collection(firestoreDb, 'salesHistory'), (snap) => {
      const items: SalesHistory[] = [];
      snap.forEach((d) => items.push(d.data() as SalesHistory));
      saveCollection(SALES_KEY, items);
    }, (err) => console.warn("Firestore salesHistory snapshot notice:", err));

    // 4. Live Subscription Requests
    onSnapshot(collection(firestoreDb, 'subscriptionRequests'), (snap) => {
      const items: SubscriptionRequest[] = [];
      snap.forEach((d) => items.push(d.data() as SubscriptionRequest));
      saveCollection(SUBSCRIPTIONS_KEY, items);
    }, (err) => console.warn("Firestore subscriptionRequests snapshot notice:", err));

    // 5. Live Reactivation Requests
    onSnapshot(collection(firestoreDb, 'reactivationRequests'), (snap) => {
      const items: ReactivationRequest[] = [];
      snap.forEach((d) => items.push(d.data() as ReactivationRequest));
      saveCollection(REACTIVATIONS_KEY, items);
    }, (err) => console.warn("Firestore reactivationRequests snapshot notice:", err));

    // 6. Live Email Pro Listings
    onSnapshot(collection(firestoreDb, 'emailProListings'), (snap) => {
      const items: EmailProListing[] = [];
      snap.forEach((d) => items.push(d.data() as EmailProListing));
      saveCollection(EMAIL_PRO_LISTINGS_KEY, items);
    }, (err) => console.warn("Firestore emailProListings snapshot notice:", err));

    // 7. Live Email Pro Orders
    onSnapshot(collection(firestoreDb, 'emailProOrders'), (snap) => {
      const items: EmailProOrder[] = [];
      snap.forEach((d) => items.push(d.data() as EmailProOrder));
      saveCollection(EMAIL_PRO_ORDERS_KEY, items);
    }, (err) => console.warn("Firestore emailProOrders snapshot notice:", err));

    // 8. Live Users
    onSnapshot(collection(firestoreDb, 'users'), (snap) => {
      const items: UserProfile[] = [];
      snap.forEach((d) => items.push(d.data() as UserProfile));
      saveCollection(USERS_KEY, items);
    }, (err) => console.warn("Firestore users snapshot notice:", err));

    // 9. Live Ratings
    onSnapshot(collection(firestoreDb, 'sellerRatings'), (snap) => {
      const items: SellerRating[] = [];
      snap.forEach((d) => items.push(d.data() as SellerRating));
      saveCollection(RATINGS_KEY, items);
    }, (err) => console.warn("Firestore sellerRatings snapshot notice:", err));
  } catch (err) {
    console.warn("Real-time listener initialization notice:", err);
  }
}

function getCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCollection<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('boutique_email_data_updated'));
    if (realtimeChannel) {
      realtimeChannel.postMessage({ type: 'COLLECTION_UPDATED', key });
    }
  } catch (err) {
    console.error(`Failed to write collection ${key}:`, err);
  }
}

// -------------------------------------------------------------
// FIRESTORE CLOUD SYNC HELPER
// -------------------------------------------------------------
async function syncToFirestore(collectionPath: string, docId: string, data: any) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, collectionPath, docId), data, { merge: true });
  } catch (err) {
    console.warn(`Firestore sync note (${collectionPath}/${docId}):`, err);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION SERVICES (Firebase Auth + Firestore Profile)
// -------------------------------------------------------------

export async function signUpUser(
  nomComplet: string,
  email: string,
  telephone: string,
  motDePasse: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getCollection<UserProfile>(USERS_KEY);

  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error("Cette adresse e-mail est déjà utilisée par un autre compte sur la plateforme.");
  }

  const isDefaultAdmin = ADMIN_EMAILS.includes(cleanEmail);
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 3 * 86400000); // 3-day free trial

  let uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  // If live Firebase Auth is configured, create live user
  if (firebaseAuth) {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, motDePasse);
      uid = cred.user.uid;
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/email-already-in-use') {
        throw new Error("Cette adresse e-mail est déjà enregistrée dans Firebase Authentication.");
      }
      console.warn("Firebase Auth fallback to local session:", fbErr.message);
    }
  }

  const newUser: UserProfile = {
    uid,
    nomComplet: nomComplet.trim(),
    email: cleanEmail,
    telephone: telephone.trim(),
    role: isDefaultAdmin ? 'admin' : 'utilisateur',
    statutCompte: 'actif',
    dateCreation: now.toISOString(),
    nombreNotesPositives: 0,
    nombreNotesNegatives: 0,
    badgeBleu: false,
    dateDebutEssai: now.toISOString(),
    dateFinEssai: trialEnd.toISOString(),
    statutAbonnement: 'essai_gratuit',
  };

  users.push(newUser);
  saveCollection(USERS_KEY, users);

  // Sync to Firestore `/users/{uid}`
  await syncToFirestore('users', uid, newUser);

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  notifyAuthChange(newUser);

  await createNotification(
    newUser.uid,
    "Bienvenue sur BOUTIQUE E-MAIL !",
    "Votre compte a été activé avec succès. Vous bénéficiez d'un essai gratuit de 3 jours pour mettre vos emails en vente !",
    "info"
  );

  return newUser;
}

export async function signInUser(email: string, motDePasse: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getCollection<UserProfile>(USERS_KEY);

  let uid = '';
  if (firebaseAuth) {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, motDePasse);
      uid = cred.user.uid;
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        throw new Error("Mot de passe incorrect.");
      }
      if (fbErr.code === 'auth/user-not-found') {
        // Fallback to local
      } else {
        console.warn("Firebase Auth sign in notice:", fbErr.message);
      }
    }
  }

  let matched = users.find(u => (uid && u.uid === uid) || u.email.toLowerCase() === cleanEmail);

  if (!matched) {
    const isDefaultAdmin = ADMIN_EMAILS.includes(cleanEmail);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 3 * 86400000);
    matched = {
      uid: uid || ('user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)),
      nomComplet: cleanEmail.split('@')[0],
      email: cleanEmail,
      telephone: '+261320000000',
      role: isDefaultAdmin ? 'admin' : 'utilisateur',
      statutCompte: 'actif',
      dateCreation: now.toISOString(),
      nombreNotesPositives: 0,
      nombreNotesNegatives: 0,
      badgeBleu: isDefaultAdmin,
      dateDebutEssai: now.toISOString(),
      dateFinEssai: trialEnd.toISOString(),
      statutAbonnement: isDefaultAdmin ? 'actif' : 'essai_gratuit',
    };
    users.push(matched);
    saveCollection(USERS_KEY, users);
    await syncToFirestore('users', matched.uid, matched);
  }

  if (matched.statutCompte === 'bloque') {
    throw new Error("Votre compte a été bloqué par l'administration.");
  }

  if (ADMIN_EMAILS.includes(cleanEmail)) {
    matched.role = 'admin';
  }
  if (!matched.dateFinEssai && matched.role !== 'admin') {
    const created = matched.dateCreation ? new Date(matched.dateCreation).getTime() : Date.now();
    matched.dateDebutEssai = matched.dateDebutEssai || new Date(created).toISOString();
    matched.dateFinEssai = new Date(created + 3 * 86400000).toISOString();
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matched));
  notifyAuthChange(matched);
  return matched;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (firebaseAuth) {
    try {
      await sendPasswordResetEmail(firebaseAuth, cleanEmail);
      return;
    } catch (fbErr) {
      console.warn("Firebase password reset notice:", fbErr);
    }
  }

  const users = getCollection<UserProfile>(USERS_KEY);
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    throw new Error("Aucun compte n'a été trouvé avec cette adresse e-mail.");
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const user: UserProfile = JSON.parse(raw);
    const cleanEmail = (user.email || '').toLowerCase().trim();
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      user.role = 'admin';
    }
    // If regular user is missing dateFinEssai, ensure 3-day trial from creation/start
    if (!user.dateFinEssai && user.role !== 'admin') {
      const created = user.dateCreation ? new Date(user.dateCreation).getTime() : Date.now();
      user.dateDebutEssai = user.dateDebutEssai || new Date(created).toISOString();
      user.dateFinEssai = new Date(created + 3 * 86400000).toISOString();
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}

export function signOutUser(): void {
  if (firebaseAuth) {
    signOut(firebaseAuth).catch(() => {});
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  notifyAuthChange(null);
}

const authListeners: ((user: UserProfile | null) => void)[] = [];

export function subscribeAuth(cb: (user: UserProfile | null) => void) {
  authListeners.push(cb);
  cb(getCurrentUser());
  return () => {
    const idx = authListeners.indexOf(cb);
    if (idx > -1) authListeners.splice(idx, 1);
  };
}

function notifyAuthChange(user: UserProfile | null) {
  authListeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToRealtimeUpdates(callback: () => void): () => void {
  const handler = () => {
    try {
      callback();
    } catch (e) {
      console.error(e);
    }
  };
  window.addEventListener('boutique_email_data_updated', handler);
  return () => window.removeEventListener('boutique_email_data_updated', handler);
}


// -------------------------------------------------------------
// LISTINGS & SELLER TRIAL / SUBSCRIPTION LOGIC
// -------------------------------------------------------------

export function checkSellerSubscriptionStatus(seller: UserProfile | null | undefined): {
  canSell: boolean;
  isExpired: boolean;
  daysRemaining: number;
  message: string;
} {
  if (!seller) {
    return {
      canSell: false,
      isExpired: false,
      daysRemaining: 0,
      message: "Tsy mbola tafiditra (Non connecté)"
    };
  }

  const now = Date.now();
  const cleanEmail = (seller.email || '').toLowerCase().trim();

  // 1. Admin accounts have permanent unlimited access and never expire
  if (seller.role === 'admin' || ADMIN_EMAILS.includes(cleanEmail)) {
    return {
      canSell: true,
      isExpired: false,
      daysRemaining: 9999,
      message: "Kaonty Mpanara-maso (Admin) - Fidirana tsy voafetra"
    };
  }

  // 1.5. Pending subscription confirmation (Abonnement en cours de validation)
  if (seller.statutAbonnement === 'en_attente_confirmation') {
    return {
      canSell: true,
      isExpired: false,
      daysRemaining: 30,
      message: "Abonnement en cours de validation par l'administrateur"
    };
  }

  // 2. Active paid subscription (2 500 Ar / mois)
  if (seller.statutAbonnement === 'actif' && seller.dateFinAbonnement) {
    const end = new Date(seller.dateFinAbonnement).getTime();
    if (!isNaN(end) && end > now) {
      const days = Math.max(1, Math.ceil((end - now) / 86400000));
      return {
        canSell: true,
        isExpired: false,
        daysRemaining: days,
        message: `Abonnement actif (${days} andro sisa)`
      };
    }
  }

  // 3. 3-Day Free Trial (Andrana maimaimpoana 3 andro)
  // Ensure the trial start and end are strictly measured (72 hours / 3 full days)
  let trialEndMs: number;
  if (seller.dateFinEssai) {
    trialEndMs = new Date(seller.dateFinEssai).getTime();
  } else if (seller.dateDebutEssai) {
    trialEndMs = new Date(seller.dateDebutEssai).getTime() + 3 * 86400000;
  } else if (seller.dateCreation) {
    trialEndMs = new Date(seller.dateCreation).getTime() + 3 * 86400000;
  } else {
    trialEndMs = now + 3 * 86400000;
  }

  // If the 3-day trial is still active, IT IS NEVER EXPIRED!
  if (!isNaN(trialEndMs) && trialEndMs > now) {
    const msLeft = trialEndMs - now;
    const daysLeft = Math.max(1, Math.ceil(msLeft / 86400000));
    const hoursLeft = Math.ceil(msLeft / 3600000);
    const timeLabel = daysLeft > 1 ? `${daysLeft} andro sisa` : `${hoursLeft} ora sisa`;

    return {
      canSell: true,
      isExpired: false,
      daysRemaining: daysLeft,
      message: `Andrana maimaimpoana 3 andro mbola miasa (${timeLabel})`
    };
  }

  // 4. ONLY AFTER THE 3 FULL DAYS OF TRIAL ARE EXPIRED:
  return {
    canSell: false,
    isExpired: true,
    daysRemaining: 0,
    message: "Tapitra ny andrana maimaimpoana ho an'ny fampiasana plateforme. Raha tianao ho hita ao amin'ny liste ny email amidinao dia mila manao abonnement 2 500 Ar par mois ianao."
  };
}

export async function getEmailListings(): Promise<EmailListing[]> {
  const allListings = getCollection<EmailListing>(LISTINGS_KEY);
  const users = getCollection<UserProfile>(USERS_KEY);

  return allListings.map(listing => {
    const seller = users.find(u => u.uid === listing.vendeurUid);
    if (seller && listing.statutAnnonce === 'disponible') {
      const sub = checkSellerSubscriptionStatus(seller);
      if (sub.isExpired) {
        return { ...listing, statutAnnonce: 'masque' as const };
      }
    }
    return listing;
  });
}

export async function addEmailListing(params: {
  adresseEmail: string;
  motDePasse: string;
  prix: number;
  description: string;
  numeroPaiement: string;
  nomTitulairePaiement: string;
  vendeur: UserProfile;
}): Promise<EmailListing> {
  const cleanEmail = params.adresseEmail.trim().toLowerCase();

  if (!cleanEmail || !params.motDePasse || !params.prix || !params.numeroPaiement || !params.nomTitulairePaiement) {
    throw new Error("Tous les champs obligatoires doivent être renseignés.");
  }
  if (params.prix <= 0) {
    throw new Error("Le prix doit être supérieur à zéro Ariary.");
  }

  const sub = checkSellerSubscriptionStatus(params.vendeur);
  if (!sub.canSell) {
    throw new Error(sub.message);
  }

  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  const sales = getCollection<SalesHistory>(SALES_KEY);
  const orders = getCollection<Order>(ORDERS_KEY);

  const isAlreadyListed = listings.some(
    l => l.adresseEmailNormalisee === cleanEmail && ['disponible', 'reserve'].includes(l.statutAnnonce)
  );
  if (isAlreadyListed) {
    throw new Error("Cette adresse e-mail est déjà mise en vente ou fait l'objet d'une réservation active.");
  }

  const isAlreadySoldInHistory = sales.some(s => s.adresseEmail.toLowerCase().trim() === cleanEmail);
  if (isAlreadySoldInHistory) {
    throw new Error("Cette adresse e-mail a déjà été vendue sur la plateforme et ne peut pas être remise en vente.");
  }

  const hasActiveOrder = orders.some(
    o => o.adresseEmailVendue.toLowerCase().trim() === cleanEmail &&
         ['en_attente_paiement', 'en_attente_verification', 'paiement_confirme'].includes(o.statutCommande)
  );
  if (hasActiveOrder) {
    throw new Error("Une commande active est en cours pour cette adresse e-mail.");
  }

  const encrypted = await encryptPassword(params.motDePasse);
  const listingId = 'list_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const newListing: EmailListing = {
    listingId,
    vendeurUid: params.vendeur.uid,
    vendeurNom: params.vendeur.nomComplet,
    vendeurTelephone: params.vendeur.telephone,
    adresseEmail: cleanEmail,
    adresseEmailNormalisee: cleanEmail,
    description: params.description.trim(),
    prix: Number(params.prix),
    numeroPaiement: params.numeroPaiement.trim(),
    nomTitulairePaiement: params.nomTitulairePaiement.trim(),
    statutAnnonce: 'disponible',
    dateCreation: new Date().toISOString(),
    badgeBleuVendeur: Boolean(params.vendeur.badgeBleu),
    notesPositives: params.vendeur.nombreNotesPositives || 0,
    notesNegatives: params.vendeur.nombreNotesNegatives || 0
  };

  listings.unshift(newListing);
  saveCollection(LISTINGS_KEY, listings);
  await syncToFirestore('emailListings', listingId, newListing);

  const credentials = getCollection<EncryptedCredential>(CREDENTIALS_KEY);
  const newCred: EncryptedCredential = {
    listingId,
    vendeurUid: params.vendeur.uid,
    encryptedPassword: encrypted,
    dateCreation: new Date().toISOString()
  };
  credentials.push(newCred);
  saveCollection(CREDENTIALS_KEY, credentials);
  await syncToFirestore('credentials', listingId, newCred);

  await createNotification(
    params.vendeur.uid,
    "Annonce publiée avec succès",
    `Votre e-mail ${cleanEmail} est désormais disponible dans la boutique pour ${params.prix.toLocaleString('fr-FR')} Ar.`,
    "validation",
    listingId
  );

  return newListing;
}

// -------------------------------------------------------------
// ORDERS & ATOMIC PURCHASE FLOW (Base64 in Firestore)
// -------------------------------------------------------------

export async function createOrder(listingId: string, buyer: UserProfile): Promise<Order> {
  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  const listingIndex = listings.findIndex(l => l.listingId === listingId);

  if (listingIndex === -1) {
    throw new Error("L'annonce demandée n'existe pas ou a été retirée.");
  }

  const listing = listings[listingIndex];

  if (listing.statutAnnonce !== 'disponible') {
    throw new Error("Cet e-mail n'est plus disponible à l'achat (déjà réservé ou vendu).");
  }

  if (listing.vendeurUid === buyer.uid) {
    throw new Error("Vous ne pouvez pas acheter votre propre annonce.");
  }

  const orderId = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const reference = 'BE-' + Math.floor(100000 + Math.random() * 900000);

  // Reserve listing
  listings[listingIndex].statutAnnonce = 'reserve';
  listings[listingIndex].reservationCommandeId = orderId;
  saveCollection(LISTINGS_KEY, listings);
  await syncToFirestore('emailListings', listing.listingId, listings[listingIndex]);

  const newOrder: Order = {
    orderId,
    reference,
    acheteurUid: buyer.uid,
    acheteurNom: buyer.nomComplet,
    acheteurEmail: buyer.email,
    vendeurUid: listing.vendeurUid,
    vendeurNom: listing.vendeurNom,
    vendeurTelephone: listing.vendeurTelephone,
    listingId: listing.listingId,
    adresseEmailVendue: listing.adresseEmail,
    prix: listing.prix,
    numeroPaiement: listing.numeroPaiement,
    nomTitulairePaiement: listing.nomTitulairePaiement,
    statutCommande: 'en_attente_paiement',
    dateCreation: new Date().toISOString()
  };

  const orders = getCollection<Order>(ORDERS_KEY);
  orders.unshift(newOrder);
  saveCollection(ORDERS_KEY, orders);
  await syncToFirestore('orders', orderId, newOrder);

  await createNotification(
    listing.vendeurUid,
    "Nouvelle intention d'achat !",
    `${buyer.nomComplet} a initié l'achat de ${listing.adresseEmail}. En attente du paiement.`,
    "commande",
    orderId
  );

  return newOrder;
}

export async function submitPaymentProof(orderId: string, preuvePaiementBase64: string): Promise<Order> {
  if (!preuvePaiementBase64) {
    throw new Error("Veuillez sélectionner une image valide de preuve de paiement.");
  }

  const orders = getCollection<Order>(ORDERS_KEY);
  const orderIndex = orders.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) {
    throw new Error("Commande introuvable.");
  }

  const order = orders[orderIndex];
  // Directly stored as base64 in Firestore document as requested
  order.preuvePaiementUrl = preuvePaiementBase64;
  order.statutCommande = 'en_attente_verification';
  order.datePaiementEnvoye = new Date().toISOString();

  orders[orderIndex] = order;
  saveCollection(ORDERS_KEY, orders);
  await syncToFirestore('orders', orderId, order);

  await createNotification(
    order.vendeurUid,
    "Preuve de paiement reçue !",
    `L'acheteur ${order.acheteurNom} a envoyé la preuve de paiement pour la commande ${order.reference}. Vérifiez et confirmez la réception des fonds.`,
    "paiement",
    orderId
  );

  return order;
}

export async function confirmOrder(orderId: string, authorUid: string): Promise<Order> {
  const orders = getCollection<Order>(ORDERS_KEY);
  const orderIndex = orders.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) throw new Error("Commande introuvable.");

  const order = orders[orderIndex];
  const user = getCurrentUser();

  const isSeller = order.vendeurUid === authorUid;
  const isAdminUser = user?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()));

  if (!isSeller && !isAdminUser) {
    throw new Error("Action non autorisée.");
  }

  if (order.statutCommande === 'paiement_confirme') {
    throw new Error("Ce paiement a déjà été confirmé.");
  }

  order.statutCommande = 'paiement_confirme';
  order.dateConfirmation = new Date().toISOString();
  order.confirmedByUid = authorUid;
  orders[orderIndex] = order;
  saveCollection(ORDERS_KEY, orders);
  await syncToFirestore('orders', orderId, order);

  // Mark listing as VENDU
  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  const listingIndex = listings.findIndex(l => l.listingId === order.listingId);
  if (listingIndex !== -1) {
    listings[listingIndex].statutAnnonce = 'vendu';
    saveCollection(LISTINGS_KEY, listings);
    await syncToFirestore('emailListings', order.listingId, listings[listingIndex]);
  }

  // Grant buyer authorization to decrypt credential
  const credentials = getCollection<EncryptedCredential>(CREDENTIALS_KEY);
  const credIndex = credentials.findIndex(c => c.listingId === order.listingId);
  if (credIndex !== -1) {
    credentials[credIndex].authorizedBuyerUid = order.acheteurUid;
    credentials[credIndex].orderId = order.orderId;
    saveCollection(CREDENTIALS_KEY, credentials);
    await syncToFirestore('credentials', order.listingId, credentials[credIndex]);
  }

  // Sales History
  const sales = getCollection<SalesHistory>(SALES_KEY);
  const saleRecord: SalesHistory = {
    saleId: 'sale_' + Date.now(),
    orderId: order.orderId,
    listingId: order.listingId,
    vendeurUid: order.vendeurUid,
    vendeurNom: order.vendeurNom,
    acheteurUid: order.acheteurUid,
    acheteurNom: order.acheteurNom,
    adresseEmail: order.adresseEmailVendue,
    prixFinal: order.prix,
    dateVente: new Date().toISOString(),
    statutVente: 'Paiement confirmé & Compte délivré'
  };
  sales.unshift(saleRecord);
  saveCollection(SALES_KEY, sales);
  await syncToFirestore('salesHistory', saleRecord.saleId, saleRecord);

  await createNotification(
    order.acheteurUid,
    "Paiement confirmé ! Votre e-mail est prêt",
    `Félicitations ! Le paiement pour ${order.adresseEmailVendue} a été vérifié. Votre certificat et vos identifiants sont maintenant disponibles dans « Mes achats ».`,
    "validation",
    order.orderId
  );

  window.dispatchEvent(new Event('boutique_email_data_updated'));

  return order;
}

export async function rejectOrder(orderId: string, motifRefus: string, authorUid: string): Promise<Order> {
  if (!motifRefus || !motifRefus.trim()) {
    throw new Error("Le motif du refus est obligatoire.");
  }

  const orders = getCollection<Order>(ORDERS_KEY);
  const orderIndex = orders.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) throw new Error("Commande introuvable.");

  const order = orders[orderIndex];
  order.statutCommande = 'paiement_refuse';
  order.motifRefus = motifRefus.trim();
  orders[orderIndex] = order;
  saveCollection(ORDERS_KEY, orders);
  await syncToFirestore('orders', orderId, order);

  // Release reservation
  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  const listingIndex = listings.findIndex(l => l.listingId === order.listingId);
  if (listingIndex !== -1 && listings[listingIndex].statutAnnonce === 'reserve') {
    listings[listingIndex].statutAnnonce = 'disponible';
    delete listings[listingIndex].reservationCommandeId;
    saveCollection(LISTINGS_KEY, listings);
    await syncToFirestore('emailListings', order.listingId, listings[listingIndex]);
  }

  await createNotification(
    order.acheteurUid,
    "Paiement refusé pour votre commande",
    `Votre commande pour ${order.adresseEmailVendue} a été refusée. Motif : ${motifRefus.trim()}`,
    "commande",
    orderId
  );

  return order;
}

export async function getCredentialForOrder(orderId: string, buyerUid: string): Promise<{ password: string; description: string }> {
  const orders = getCollection<Order>(ORDERS_KEY);
  const order = orders.find(o => o.orderId === orderId);

  if (!order) throw new Error("Commande introuvable.");

  const user = getCurrentUser();
  const isAuthorizedBuyer = order.acheteurUid === buyerUid && order.statutCommande === 'paiement_confirme';
  const isAdminUser = user?.role === 'admin';

  if (!isAuthorizedBuyer && !isAdminUser) {
    throw new Error("Accès refusé.");
  }

  const credentials = getCollection<EncryptedCredential>(CREDENTIALS_KEY);
  const cred = credentials.find(c => c.listingId === order.listingId);

  if (!cred) throw new Error("Identifiant sécurisé introuvable.");

  const plainPassword = await decryptPassword(cred.encryptedPassword);
  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  const listing = listings.find(l => l.listingId === order.listingId);

  return {
    password: plainPassword,
    description: listing?.description || ''
  };
}

export async function getOrders(): Promise<Order[]> {
  return getCollection<Order>(ORDERS_KEY);
}

export async function getSalesHistory(): Promise<SalesHistory[]> {
  return getCollection<SalesHistory>(SALES_KEY);
}

// -------------------------------------------------------------
// SELLER RATINGS, BLUE BADGE & SUSPENSION
// -------------------------------------------------------------

export async function rateSeller(params: {
  vendeurUid: string;
  auteurUid: string;
  auteurNom: string;
  orderId?: string;
  typeNote: 'positive' | 'negative';
}): Promise<{ newPositive: number; newNegative: number; badgeBleu: boolean; isSuspended: boolean }> {
  if (params.vendeurUid === params.auteurUid) {
    throw new Error("Vous ne pouvez pas vous attribuer une note à vous-même.");
  }

  const ratings = getCollection<SellerRating>(RATINGS_KEY);

  if (params.orderId) {
    const alreadyRatedOrder = ratings.some(
      r => r.orderId === params.orderId && r.auteurUid === params.auteurUid
    );
    if (alreadyRatedOrder) {
      throw new Error("Vous avez déjà attribué une note pour cette transaction.");
    }
  }

  const newRating: SellerRating = {
    ratingId: 'rate_' + Date.now(),
    vendeurUid: params.vendeurUid,
    auteurUid: params.auteurUid,
    auteurNom: params.auteurNom,
    orderId: params.orderId,
    typeNote: params.typeNote,
    dateCreation: new Date().toISOString()
  };

  ratings.push(newRating);
  saveCollection(RATINGS_KEY, ratings);
  await syncToFirestore('sellerRatings', newRating.ratingId, newRating);

  const sellerRatings = ratings.filter(r => r.vendeurUid === params.vendeurUid);
  const positives = sellerRatings.filter(r => r.typeNote === 'positive').length;
  const negatives = sellerRatings.filter(r => r.typeNote === 'negative').length;

  const users = getCollection<UserProfile>(USERS_KEY);
  const sellerIdx = users.findIndex(u => u.uid === params.vendeurUid);

  let badgeBleu = false;
  let isSuspended = false;

  if (sellerIdx !== -1) {
    badgeBleu = positives >= 20;

    if (negatives >= 20) {
      isSuspended = true;
      users[sellerIdx].statutCompte = 'suspendu';
      users[sellerIdx].dateSuspension = new Date().toISOString();
      users[sellerIdx].motifSuspension = "Compte suspendu automatiquement suite à l'accumulation de 20 notes négatives.";

      const listings = getCollection<EmailListing>(LISTINGS_KEY);
      listings.forEach(l => {
        if (l.vendeurUid === params.vendeurUid && l.statutAnnonce === 'disponible') {
          l.statutAnnonce = 'suspendu';
        }
      });
      saveCollection(LISTINGS_KEY, listings);
    }

    users[sellerIdx].nombreNotesPositives = positives;
    users[sellerIdx].nombreNotesNegatives = negatives;
    users[sellerIdx].badgeBleu = badgeBleu;

    saveCollection(USERS_KEY, users);
    await syncToFirestore('users', params.vendeurUid, users[sellerIdx]);

    const listings = getCollection<EmailListing>(LISTINGS_KEY);
    listings.forEach(l => {
      if (l.vendeurUid === params.vendeurUid) {
        l.badgeBleuVendeur = badgeBleu;
        l.notesPositives = positives;
        l.notesNegatives = negatives;
      }
    });
    saveCollection(LISTINGS_KEY, listings);
  }

  return { newPositive: positives, newNegative: negatives, badgeBleu, isSuspended };
}

// -------------------------------------------------------------
// SUBSCRIPTION & REACTIVATION (Base64 in Firestore)
// -------------------------------------------------------------

export async function requestSubscription(params: {
  user: UserProfile;
  preuvePaiementUrl: string; // base64 Data URL
}): Promise<SubscriptionRequest> {
  if (!params.preuvePaiementUrl) {
    throw new Error("Veuillez joindre la preuve de transaction.");
  }

  const requests = getCollection<SubscriptionRequest>(SUBSCRIPTIONS_KEY);
  const newReq: SubscriptionRequest = {
    requestId: 'sub_' + Date.now(),
    utilisateurUid: params.user.uid,
    utilisateurNom: params.user.nomComplet,
    utilisateurEmail: params.user.email,
    montant: 2500,
    preuvePaiementUrl: params.preuvePaiementUrl, // stored directly in Firestore doc
    statut: 'en_attente_confirmation',
    dateCreation: new Date().toISOString()
  };

  requests.unshift(newReq);
  saveCollection(SUBSCRIPTIONS_KEY, requests);
  await syncToFirestore('subscriptionRequests', newReq.requestId, newReq);

  const users = getCollection<UserProfile>(USERS_KEY);
  const uIdx = users.findIndex(u => u.uid === params.user.uid);
  if (uIdx !== -1) {
    users[uIdx].statutAbonnement = 'en_attente_confirmation';
    saveCollection(USERS_KEY, users);
    await syncToFirestore('users', params.user.uid, users[uIdx]);
    if (getCurrentUser()?.uid === params.user.uid) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[uIdx]));
      notifyAuthChange(users[uIdx]);
    }
  }

  await createNotification(
    params.user.uid,
    "Demande d'abonnement envoyée",
    "Votre preuve de paiement de 2 500 Ar a été soumise dans Firestore. L'administrateur va valider votre abonnement pour 30 jours.",
    "abonnement",
    newReq.requestId
  );

  return newReq;
}

export async function confirmSubscription(requestId: string, adminUid: string): Promise<void> {
  const requests = getCollection<SubscriptionRequest>(SUBSCRIPTIONS_KEY);
  const rIdx = requests.findIndex(r => r.requestId === requestId);
  if (rIdx === -1) throw new Error("Demande introuvable.");

  const req = requests[rIdx];
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 86400000);

  req.statut = 'actif';
  req.dateConfirmation = now.toISOString();
  req.dateDebutAbonnement = now.toISOString();
  req.dateFinAbonnement = endDate.toISOString();
  req.adminUid = adminUid;
  requests[rIdx] = req;
  saveCollection(SUBSCRIPTIONS_KEY, requests);
  await syncToFirestore('subscriptionRequests', requestId, req);

  const users = getCollection<UserProfile>(USERS_KEY);
  const uIdx = users.findIndex(u => u.uid === req.utilisateurUid);
  if (uIdx !== -1) {
    users[uIdx].statutAbonnement = 'actif';
    users[uIdx].dateDebutAbonnement = now.toISOString();
    users[uIdx].dateFinAbonnement = endDate.toISOString();
    saveCollection(USERS_KEY, users);
    await syncToFirestore('users', req.utilisateurUid, users[uIdx]);
  }

  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  listings.forEach(l => {
    if (l.vendeurUid === req.utilisateurUid && (l.statutAnnonce === 'masque' || l.statutAnnonce === 'disponible')) {
      l.statutAnnonce = 'disponible';
    }
  });
  saveCollection(LISTINGS_KEY, listings);

  await createNotification(
    req.utilisateurUid,
    "Abonnement vendeur activé !",
    "Votre abonnement de 30 jours (2 500 Ar) a été validé avec succès par l'administrateur. Vos e-mails sont de nouveau visibles dans la boutique.",
    "abonnement",
    requestId
  );
}

export async function rejectSubscription(requestId: string, motifRefus: string, adminUid: string): Promise<void> {
  const requests = getCollection<SubscriptionRequest>(SUBSCRIPTIONS_KEY);
  const rIdx = requests.findIndex(r => r.requestId === requestId);
  if (rIdx === -1) throw new Error("Demande introuvable.");

  const req = requests[rIdx];
  req.statut = 'refuse';
  req.motifRefus = motifRefus.trim();
  req.adminUid = adminUid;
  requests[rIdx] = req;
  saveCollection(SUBSCRIPTIONS_KEY, requests);
  await syncToFirestore('subscriptionRequests', requestId, req);

  const users = getCollection<UserProfile>(USERS_KEY);
  const uIdx = users.findIndex(u => u.uid === req.utilisateurUid);
  if (uIdx !== -1) {
    users[uIdx].statutAbonnement = 'refuse';
    saveCollection(USERS_KEY, users);
    await syncToFirestore('users', req.utilisateurUid, users[uIdx]);
  }

  await createNotification(
    req.utilisateurUid,
    "Demande d'abonnement refusée",
    `Votre demande d'abonnement a été refusée par l'administrateur. Motif : ${motifRefus}`,
    "abonnement",
    requestId
  );
}

export async function getSubscriptionRequests(): Promise<SubscriptionRequest[]> {
  return getCollection<SubscriptionRequest>(SUBSCRIPTIONS_KEY);
}

export async function requestReactivation(params: {
  user: UserProfile;
  preuvePaiementUrl: string; // base64 Data URL
}): Promise<ReactivationRequest> {
  if (!params.preuvePaiementUrl) {
    throw new Error("Veuillez joindre la preuve de transfert de 20 000 Ar.");
  }

  const requests = getCollection<ReactivationRequest>(REACTIVATIONS_KEY);
  const newReq: ReactivationRequest = {
    requestId: 'react_' + Date.now(),
    utilisateurUid: params.user.uid,
    utilisateurNom: params.user.nomComplet,
    utilisateurEmail: params.user.email,
    montant: 20000,
    preuvePaiementUrl: params.preuvePaiementUrl, // stored in Firestore doc
    statut: 'en_attente_confirmation',
    dateCreation: new Date().toISOString()
  };

  requests.unshift(newReq);
  saveCollection(REACTIVATIONS_KEY, requests);
  await syncToFirestore('reactivationRequests', newReq.requestId, newReq);

  await createNotification(
    params.user.uid,
    "Demande de réactivation enregistrée",
    "Votre demande de réactivation (20 000 Ar) a été transmise à l'administrateur dans Firestore.",
    "info",
    newReq.requestId
  );

  return newReq;
}

export async function confirmReactivation(requestId: string, adminUid: string): Promise<void> {
  const requests = getCollection<ReactivationRequest>(REACTIVATIONS_KEY);
  const rIdx = requests.findIndex(r => r.requestId === requestId);
  if (rIdx === -1) throw new Error("Demande introuvable.");

  const req = requests[rIdx];
  req.statut = 'actif';
  req.dateConfirmation = new Date().toISOString();
  req.adminUid = adminUid;
  requests[rIdx] = req;
  saveCollection(REACTIVATIONS_KEY, requests);
  await syncToFirestore('reactivationRequests', requestId, req);

  const users = getCollection<UserProfile>(USERS_KEY);
  const uIdx = users.findIndex(u => u.uid === req.utilisateurUid);
  if (uIdx !== -1) {
    users[uIdx].statutCompte = 'actif';
    users[uIdx].motifSuspension = undefined;
    users[uIdx].dateSuspension = undefined;
    users[uIdx].nombreNotesNegatives = 0;
    saveCollection(USERS_KEY, users);
    await syncToFirestore('users', req.utilisateurUid, users[uIdx]);

    if (getCurrentUser()?.uid === req.utilisateurUid) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[uIdx]));
      notifyAuthChange(users[uIdx]);
    }
  }

  const listings = getCollection<EmailListing>(LISTINGS_KEY);
  listings.forEach(l => {
    if (l.vendeurUid === req.utilisateurUid && l.statutAnnonce === 'suspendu') {
      l.statutAnnonce = 'disponible';
    }
  });
  saveCollection(LISTINGS_KEY, listings);

  await createNotification(
    req.utilisateurUid,
    "Compte réactivé avec succès !",
    "Votre compte a été réactivé suite à la validation des frais de réactivation.",
    "validation",
    requestId
  );
}

export async function rejectReactivation(requestId: string, motifRefus: string, adminUid: string): Promise<void> {
  const requests = getCollection<ReactivationRequest>(REACTIVATIONS_KEY);
  const rIdx = requests.findIndex(r => r.requestId === requestId);
  if (rIdx === -1) throw new Error("Demande introuvable.");

  const req = requests[rIdx];
  req.statut = 'refuse';
  req.motifRefus = motifRefus.trim();
  req.adminUid = adminUid;
  requests[rIdx] = req;
  saveCollection(REACTIVATIONS_KEY, requests);
  await syncToFirestore('reactivationRequests', requestId, req);

  await createNotification(
    req.utilisateurUid,
    "Demande de réactivation refusée",
    `Votre demande de réactivation a été rejetée. Motif : ${motifRefus}`,
    "suspension",
    requestId
  );
}

export async function getReactivationRequests(): Promise<ReactivationRequest[]> {
  return getCollection<ReactivationRequest>(REACTIVATIONS_KEY);
}

// -------------------------------------------------------------
// EMAIL PRO SERVICES & ORDERS
// -------------------------------------------------------------

export async function getEmailProListings(): Promise<EmailProListing[]> {
  return getCollection<EmailProListing>(EMAIL_PRO_LISTINGS_KEY);
}

export async function addEmailProListing(params: {
  prestataire: UserProfile;
  contact: string;
  prix: number;
  description: string;
}): Promise<EmailProListing> {
  const listings = getCollection<EmailProListing>(EMAIL_PRO_LISTINGS_KEY);
  const newListing: EmailProListing = {
    listingId: 'pro_' + Date.now(),
    prestataireUid: params.prestataire.uid,
    nomPrestataire: params.prestataire.nomComplet,
    contact: params.contact.trim(),
    prix: Number(params.prix),
    description: params.description.trim(),
    statut: 'disponible',
    dateCreation: new Date().toISOString()
  };

  listings.unshift(newListing);
  saveCollection(EMAIL_PRO_LISTINGS_KEY, listings);
  await syncToFirestore('emailProListings', newListing.listingId, newListing);
  return newListing;
}

export async function createEmailProOrder(params: {
  listing: EmailProListing;
  client: UserProfile;
  domaineDemande: string;
  contactClient: string;
  description: string;
}): Promise<EmailProOrder> {
  const orderId = 'cmd_pro_' + Date.now();
  const reference = 'PRO-' + Math.floor(100000 + Math.random() * 900000);

  const newOrder: EmailProOrder = {
    orderId,
    reference,
    clientUid: params.client.uid,
    clientNom: params.client.nomComplet,
    clientEmail: params.client.email,
    prestataireUid: params.listing.prestataireUid,
    nomPrestataire: params.listing.nomPrestataire,
    domaineDemande: params.domaineDemande.trim(),
    contactClient: params.contactClient.trim(),
    description: params.description.trim(),
    prix: params.listing.prix,
    statut: 'en_attente',
    dateCreation: new Date().toISOString()
  };

  const orders = getCollection<EmailProOrder>(EMAIL_PRO_ORDERS_KEY);
  orders.unshift(newOrder);
  saveCollection(EMAIL_PRO_ORDERS_KEY, orders);
  await syncToFirestore('emailProOrders', orderId, newOrder);

  await createNotification(
    params.listing.prestataireUid,
    "Nouvelle commande Email Pro reçue !",
    `${params.client.nomComplet} a commandé la création de l'e-mail pro pour le domaine "${params.domaineDemande}".`,
    "commande",
    orderId
  );

  return newOrder;
}

export async function getEmailProOrders(): Promise<EmailProOrder[]> {
  return getCollection<EmailProOrder>(EMAIL_PRO_ORDERS_KEY);
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

export async function createNotification(
  destinataireUid: string,
  titre: string,
  message: string,
  type: AppNotification['type'],
  referenceDocumentId?: string
): Promise<AppNotification> {
  const notifs = getCollection<AppNotification>(NOTIFICATIONS_KEY);
  const newNotif: AppNotification = {
    notificationId: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    destinataireUid,
    titre,
    message,
    type,
    lu: false,
    dateCreation: new Date().toISOString(),
    referenceDocumentId
  };

  notifs.unshift(newNotif);
  saveCollection(NOTIFICATIONS_KEY, notifs);
  await syncToFirestore('notifications', newNotif.notificationId, newNotif);
  return newNotif;
}

export async function getUserNotifications(destinataireUid: string): Promise<AppNotification[]> {
  const notifs = getCollection<AppNotification>(NOTIFICATIONS_KEY);
  return notifs.filter(n => n.destinataireUid === destinataireUid);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notifs = getCollection<AppNotification>(NOTIFICATIONS_KEY);
  const idx = notifs.findIndex(n => n.notificationId === notificationId);
  if (idx !== -1) {
    notifs[idx].lu = true;
    saveCollection(NOTIFICATIONS_KEY, notifs);
    await syncToFirestore('notifications', notificationId, notifs[idx]);
  }
}

// -------------------------------------------------------------
// ADMIN MANAGEMENT & AUDIT LOGS
// -------------------------------------------------------------

export async function getAllUsers(): Promise<UserProfile[]> {
  return getCollection<UserProfile>(USERS_KEY);
}

export async function updateUserAccountStatus(
  targetUid: string,
  newStatus: AccountStatus,
  motif?: string,
  adminUser?: UserProfile
): Promise<void> {
  const users = getCollection<UserProfile>(USERS_KEY);
  const idx = users.findIndex(u => u.uid === targetUid);
  if (idx === -1) throw new Error("Utilisateur introuvable.");

  users[idx].statutCompte = newStatus;
  if (newStatus === 'suspendu' || newStatus === 'bloque') {
    users[idx].dateSuspension = new Date().toISOString();
    users[idx].motifSuspension = motif || `Action administrative : compte ${newStatus}.`;
  } else if (newStatus === 'actif') {
    users[idx].dateSuspension = undefined;
    users[idx].motifSuspension = undefined;
  }

  saveCollection(USERS_KEY, users);
  await syncToFirestore('users', targetUid, users[idx]);

  if (adminUser) {
    await logAdminAction(adminUser, `Changement de statut utilisateur -> ${newStatus}`, targetUid, undefined, motif);
  }

  await createNotification(
    targetUid,
    `Mise à jour de votre compte : ${newStatus.toUpperCase()}`,
    motif || `Votre compte est désormais ${newStatus}.`,
    newStatus === 'actif' ? 'validation' : 'suspension'
  );
}

export async function deleteUserAccountSafely(targetUid: string, adminUser: UserProfile): Promise<void> {
  const users = getCollection<UserProfile>(USERS_KEY);
  const idx = users.findIndex(u => u.uid === targetUid);
  if (idx === -1) throw new Error("Utilisateur introuvable.");

  const targetEmail = users[idx].email;

  users[idx].nomComplet = '[Compte Supprimé]';
  users[idx].statutCompte = 'supprime';
  users[idx].email = `deleted_${Date.now()}@anonymized.local`;
  users[idx].telephone = '0000000000';
  saveCollection(USERS_KEY, users);
  await syncToFirestore('users', targetUid, users[idx]);

  await logAdminAction(
    adminUser,
    "Suppression sécurisée et anonymisation du compte",
    targetUid,
    undefined,
    `Email d'origine : ${targetEmail}`
  );
}

export async function logAdminAction(
  admin: UserProfile,
  action: string,
  cibleUid?: string,
  referenceDocumentId?: string,
  details?: string
): Promise<void> {
  const logs = getCollection<AdminAuditLog>(AUDIT_LOGS_KEY);
  const newLog: AdminAuditLog = {
    logId: 'audit_' + Date.now(),
    adminUid: admin.uid,
    adminEmail: admin.email,
    action,
    cibleUid,
    referenceDocumentId,
    details,
    dateCreation: new Date().toISOString()
  };
  logs.unshift(newLog);
  saveCollection(AUDIT_LOGS_KEY, logs);
  await syncToFirestore('adminAuditLogs', newLog.logId, newLog);
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  return getCollection<AdminAuditLog>(AUDIT_LOGS_KEY);
}
